import prisma from '@/lib/prisma'
import { decimalToNumber } from '@/lib/decimal-utils'
import { convertCents } from '@/lib/exchange'

export type PriceComponent = {
  code: string
  label: string
  amountCents: number // positive for surcharges/overage, negative for discounts
}

export type PriceBreakdown = {
  currency: string
  baseCents: number
  components: PriceComponent[]
  subtotalCents: number
  totalCents: number
}

export type PricingOptions = {
  currency?: string // target currency, defaults to base currency (e.g., USD)
  weekendSurchargePercent?: number // e.g., 0.15 for +15%
  emergencySurchargePercent?: number // e.g., 0.25 for +25%
  peakHours?: { startHour: number; endHour: number }[] // [start,end) local hours
  peakSurchargePercent?: number // e.g., 0.1 for +10%
  promoCode?: string
  promoResolver?: (code: string, args: { serviceId: string }) => Promise<PriceComponent | null> | PriceComponent | null
}

function percentOf(amountCents: number, percent: number) {
  return Math.round(amountCents * percent)
}

function isWeekend(d: Date) {
  const day = d.getDay()
  return day === 0 || day === 6
}

function isWithinPeak(d: Date, ranges: { startHour: number; endHour: number }[]) {
  const h = d.getHours()
  return ranges.some(r => h >= r.startHour && h < r.endHour)
}

export async function calculateServicePrice(params: {
  serviceId: string
  scheduledAt: Date
  durationMinutes?: number
  options?: PricingOptions
}) : Promise<PriceBreakdown> {
  const { serviceId, scheduledAt } = params
  const options = params.options || {}

  const svc = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!svc || svc.active === false) {
    return { currency: 'USD', baseCents: 0, components: [], subtotalCents: 0, totalCents: 0 }
  }

  // Base currency and base price
  const baseCurrency = process.env.EXCHANGE_BASE_CURRENCY || 'USD'
  const targetCurrency = options.currency || baseCurrency

  const basePrice = decimalToNumber(svc.basePrice ?? svc.price ?? 0)
  const standardDuration = Math.max(15, svc.duration ?? 60)

  let baseCents = Math.round(basePrice * 100)
  let components: PriceComponent[] = []

  const durationMinutes = Math.max(15, params.durationMinutes ?? standardDuration)

  // Duration overage (pro-rata over standard duration)
  if (durationMinutes > standardDuration && baseCents > 0) {
    const extra = durationMinutes - standardDuration
    const overageCents = Math.round((baseCents * extra) / standardDuration)
    if (overageCents > 0) components.push({ code: 'OVERAGE', label: 'Duration overage', amountCents: overageCents })
  }

  // Weekend surcharge
  const weekendPct = options.weekendSurchargePercent ?? 0.15
  if (weekendPct > 0 && isWeekend(scheduledAt)) {
    const w = percentOf(baseCents, weekendPct)
    if (w > 0) components.push({ code: 'WEEKEND', label: 'Weekend surcharge', amountCents: w })
  }

  // Peak hours surcharge
  const peakRanges = options.peakHours ?? [ { startHour: 10, endHour: 12 }, { startHour: 15, endHour: 17 } ]
  const peakPct = options.peakSurchargePercent ?? 0.1
  if (peakPct > 0 && peakRanges.length > 0 && isWithinPeak(scheduledAt, peakRanges)) {
    const p = percentOf(baseCents, peakPct)
    if (p > 0) components.push({ code: 'PEAK', label: 'Peak hours surcharge', amountCents: p })
  }

  // Emergency surcharge
  const emergencyPct = options.emergencySurchargePercent ?? 0
  if (emergencyPct > 0) {
    const e = percentOf(baseCents, emergencyPct)
    if (e > 0) components.push({ code: 'EMERGENCY', label: 'Emergency surcharge', amountCents: e })
  }

  // Promotions (discounts are negative amountCents)
  if (options.promoCode && options.promoResolver) {
    const discount = await options.promoResolver(options.promoCode, { serviceId })
    if (discount) components.push({ ...discount, amountCents: discount.amountCents })
  }

  const subtotalCents = baseCents
  const totalBeforeCurrency = subtotalCents + components.reduce((sum, c) => sum + c.amountCents, 0)

  // Currency conversion if needed
  if (targetCurrency !== baseCurrency) {
    const latestRate = await prisma.exchangeRate.findFirst({ where: { base: baseCurrency, target: targetCurrency }, orderBy: { fetchedAt: 'desc' } })
    const rate = latestRate?.rate ?? 1
    const convertedBase = convertCents(baseCents, rate)
    const convertedComponents = components.map(c => ({ ...c, amountCents: convertCents(c.amountCents, rate) }))
    const convertedSubtotal = convertedBase
    const convertedTotal = convertedSubtotal + convertedComponents.reduce((s, c) => s + c.amountCents, 0)

    return {
      currency: targetCurrency,
      baseCents: convertedBase,
      components: convertedComponents,
      subtotalCents: convertedSubtotal,
      totalCents: convertedTotal,
    }
  }

  return {
    currency: baseCurrency,
    baseCents,
    components,
    subtotalCents,
    totalCents: totalBeforeCurrency,
  }
}
