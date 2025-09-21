import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addDays, format, startOfDay, endOfDay } from 'date-fns'
import { calculateServicePrice } from '@/lib/booking/pricing'
import { getAvailabilityForService, type BusinessHours, normalizeBusinessHours } from '@/lib/booking/availability'


function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

// GET /api/bookings/availability - Get available time slots
export async function GET(request: NextRequest) {
  try {
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

    const service = await prisma.service.findUnique({ where: { id: serviceId, active: true } })
    if (!service || service.bookingEnabled === false) {
      return NextResponse.json({ error: 'Service not available for booking' }, { status: 404 })
    }

    const now = new Date()
    const startDate = dateParam ? new Date(dateParam) : now
    const rangeStart = startDate
    const rangeEnd = addDays(rangeStart, days)

    // Enforce min/max advance booking windows
    const minAdvanceHours = typeof service.minAdvanceHours === 'number' ? service.minAdvanceHours : 0
    const advanceDays = typeof service.advanceBookingDays === 'number' ? service.advanceBookingDays : 30
    const windowStart = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + advanceDays * 24 * 60 * 60 * 1000)

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
    for (const s of filtered) {
      if (!s.available) continue
      const start = new Date(s.start)
      const key = ymd(start)
      if (!byDay.has(key)) byDay.set(key, [])

      let priceCents: number | undefined
      let priceCurrency: string | undefined
      if (includePrice) {
        try {
          const price = await calculateServicePrice({
            serviceId,
            scheduledAt: start,
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
          priceCents = price.totalCents
          priceCurrency = price.currency
        } catch {}
      }

      byDay.get(key)!.push({
        start: s.start,
        end: s.end,
        available: true,
        ...(priceCents != null ? { priceCents, currency: priceCurrency } : {}),
      })
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
