import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addDays, format, startOfDay, endOfDay } from 'date-fns'
import { calculateServicePrice } from '@/lib/booking/pricing'
import { getAvailabilityForService, type BusinessHours } from '@/lib/booking/availability'

function toMinutes(str: string) {
  const [h, m] = str.split(':').map((v) => parseInt(v, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function normalizeBusinessHours(raw: unknown): BusinessHours | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: BusinessHours = {} as any
  const asObj = raw as Record<string, any>

  // Support array[0..6] or object keyed by weekday ('0'..'6')
  const keys = Array.isArray(raw) ? Object.keys(raw as any) : Object.keys(asObj)
  for (const k of keys) {
    const idx = Number(k)
    const val = (Array.isArray(raw) ? (raw as any)[k as any] : asObj[k])
    if (val == null) continue

    // Formats supported: { startMinutes, endMinutes } OR { startTime: '09:00', endTime: '17:00' } OR { start: 540, end: 1020 } OR '09:00-17:00'
    if (typeof val === 'string') {
      const parts = val.split('-')
      if (parts.length === 2) {
        const s = toMinutes(parts[0].trim())
        const e = toMinutes(parts[1].trim())
        if (s != null && e != null) out[idx] = { startMinutes: s, endMinutes: e }
      }
      continue
    }
    if (typeof val === 'object') {
      if (typeof val.startMinutes === 'number' && typeof val.endMinutes === 'number') {
        out[idx] = { startMinutes: val.startMinutes, endMinutes: val.endMinutes }
        continue
      }
      if (typeof val.start === 'number' && typeof val.end === 'number') {
        out[idx] = { startMinutes: val.start, endMinutes: val.end }
        continue
      }
      if (typeof val.startTime === 'string' && typeof val.endTime === 'string') {
        const s = toMinutes(val.startTime)
        const e = toMinutes(val.endTime)
        if (s != null && e != null) out[idx] = { startMinutes: s, endMinutes: e }
        continue
      }
    }
  }
  return Object.keys(out).length ? out : undefined
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

// GET /api/bookings/availability - Get available time slots
export async function GET(request: NextRequest) {
  try {
    console.log('[availability] GET start')
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const dateParam = searchParams.get('date')
    const days = Math.max(1, parseInt(searchParams.get('days') || '7', 10))
    const includePriceFlag = (searchParams.get('includePrice') || '').toLowerCase()
    const includePrice = includePriceFlag === '1' || includePriceFlag === 'true' || includePriceFlag === 'yes'
    const currency = searchParams.get('currency') || undefined
    const promoCode = (searchParams.get('promoCode') || '').trim() || undefined
    const teamMemberId = searchParams.get('teamMemberId') || undefined

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) return NextResponse.json({ error: 'Service not available for booking' }, { status: 404 })
    // Support either string status OR legacy boolean active flag on service
    const hasStatus = typeof (service as any).status === 'string'
    const isActive = hasStatus ? String((service as any).status).toUpperCase() === 'ACTIVE' : ((service as any).active !== false)
    if (!isActive || service.bookingEnabled === false) {
      return NextResponse.json({ error: 'Service not available for booking' }, { status: 404 })
    }

    const now = new Date()
    const startDate = dateParam ? new Date(dateParam) : now
    const rangeStart = startDate
    const rangeEnd = addDays(rangeStart, days)

    // Enforce min/max advance booking windows
    const bookingType = (searchParams.get('bookingType') || '').toUpperCase()

    const minAdvanceHours = typeof service.minAdvanceHours === 'number' ? service.minAdvanceHours : 0
    const advanceDays = typeof service.advanceBookingDays === 'number' ? service.advanceBookingDays : null

    // If emergency booking requested, skip minAdvance enforcement
    const windowStart = bookingType === 'EMERGENCY' ? now : new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)
    // Only cap the end window when advanceBookingDays is explicitly configured; otherwise allow the requested range
    const windowEnd = advanceDays != null ? new Date(now.getTime() + advanceDays * 24 * 60 * 60 * 1000) : rangeEnd

    // Business hours normalization and options
    const businessHours = normalizeBusinessHours(service.businessHours as any)
    const bookingBufferMinutes = typeof service.bufferTime === 'number' ? service.bufferTime : 0
    const maxDailyBookings = typeof service.maxDailyBookings === 'number' ? service.maxDailyBookings : 0

    const from = rangeStart < windowStart ? windowStart : rangeStart
    const to = rangeEnd > windowEnd ? windowEnd : rangeEnd

    if (from > to) {
      return NextResponse.json({ serviceId, duration: service.duration || 60, availability: [] })
    }

    // Generate availability via domain service
    const { slots } = await getAvailabilityForService({
      serviceId,
      from: startOfDay(from),
      to: endOfDay(to),
      teamMemberId,
      options: {
        bookingBufferMinutes,
        maxDailyBookings,
        businessHours,
        skipWeekends: false, // rely on businessHours to determine open days
        now,
      },
    })

    // Apply blackout dates filtering at the day level
    const blackout = new Set((service.blackoutDates || []).map((d) => ymd(new Date(d as any))))
    const filtered = slots.filter((s) => !blackout.has(ymd(new Date(s.start))))

    // Group slots by day and compute optional pricing
    const byDay = new Map<string, any[]>()
    // Compute one price per request to avoid per-slot async work during availability
    let globalPriceCents: number | undefined
    let globalCurrency: string | undefined
    if (includePrice) {
      try {
        const refDate = filtered.length ? new Date(filtered[0].start) : new Date()
        const price = await calculateServicePrice({
          serviceId,
          scheduledAt: refDate,
          durationMinutes: service.duration || 60,
          options: {
            currency,
            promoCode,
            promoResolver: async (code: string, { serviceId }) => {
              const svc = await prisma.service.findUnique({ where: { id: serviceId } })
              if (!svc) return null
              const base = Number(svc.price ?? 0)
              const baseCents = Math.round(base * 100)
              const uc = code.toUpperCase()
              if (uc === 'WELCOME10') return { code: 'PROMO_WELCOME10', label: 'Promo WELCOME10', amountCents: Math.round(baseCents * -0.1) }
              if (uc === 'SAVE15') return { code: 'PROMO_SAVE15', label: 'Promo SAVE15', amountCents: Math.round(baseCents * -0.15) }
              return null
            },
          },
        })
        globalPriceCents = price.totalCents
        globalCurrency = price.currency
      } catch (e) {
        // ignore pricing errors and leave prices undefined
      }
    }

    for (const s of filtered) {
      if (!s.available) continue
      const start = new Date(s.start)
      const key = ymd(start)
      if (!byDay.has(key)) byDay.set(key, [])

      const entry: any = {
        start: s.start,
        end: s.end,
        available: true,
      }

      if (globalPriceCents != null) {
        entry.priceCents = globalPriceCents
        entry.currency = globalCurrency
      }

      byDay.get(key)!.push(entry)
    }

    const availability = Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, daySlots]) => ({ date, slots: daySlots }))

    return NextResponse.json({
      serviceId,
      duration: service.duration || 60,
      availability,
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}
