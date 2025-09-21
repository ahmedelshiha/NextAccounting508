import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addDays, startOfDay, endOfDay, addMinutes, format, isWeekend } from 'date-fns'
import { calculateServicePrice } from '@/lib/booking/pricing'

// GET /api/bookings/availability - Get available time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')
    const days = parseInt(searchParams.get('days') || '7')
    const includePriceFlag = (searchParams.get('includePrice') || '').toLowerCase()
    const includePrice = includePriceFlag === '1' || includePriceFlag === 'true' || includePriceFlag === 'yes'
    const currency = searchParams.get('currency') || undefined
    const promoCode = (searchParams.get('promoCode') || '').trim() || undefined

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId, active: true }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const duration = service.duration || 60 // Default 60 minutes
    const startDate = date ? new Date(date) : new Date()
    const endDate = addDays(startDate, days)

    // Get existing bookings in the date range
    const existingBookings = await prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      select: {
        scheduledAt: true,
        duration: true
      }
    })

    // Generate available time slots
    const availability = []
    
    for (let d = 0; d < days; d++) {
      const currentDate = addDays(startDate, d)
      
      // Skip weekends (optional - can be configured)
      if (isWeekend(currentDate)) {
        continue
      }

      const daySlots = []
      
      // Business hours: 9 AM to 5 PM
      const startHour = 9
      const endHour = 17
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
          const slotStart = new Date(currentDate)
          slotStart.setHours(hour, minute, 0, 0)
          
          const slotEnd = addMinutes(slotStart, duration)
          
          // Check if slot end time is within business hours
          if (slotEnd.getHours() > endHour) {
            break
          }

          // Check if slot is in the past
          if (slotStart < new Date()) {
            continue
          }

          // Check for conflicts with existing bookings
          const hasConflict = existingBookings.some(booking => {
            const bookingStart = new Date(booking.scheduledAt)
            const bookingEnd = addMinutes(bookingStart, booking.duration)
            
            return (
              (slotStart >= bookingStart && slotStart < bookingEnd) ||
              (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
              (slotStart <= bookingStart && slotEnd >= bookingEnd)
            )
          })

          if (!hasConflict) {
            let priceCents: number | undefined
            let priceCurrency: string | undefined
            if (includePrice) {
              try {
                const price = await calculateServicePrice({
                  serviceId,
                  scheduledAt: slotStart,
                  durationMinutes: duration,
                  options: {
                    currency,
                    promoCode,
                    promoResolver: async (code: string, { serviceId }) => {
                      const svc = await prisma.service.findUnique({ where: { id: serviceId } })
                      if (!svc) return null
                      const base = Number(svc.price ?? 0)
                      const baseCents = Math.round(base * 100)
                      const uc = code.toUpperCase()
                      if (uc === 'WELCOME10') {
                        const amt = Math.round(baseCents * -0.10)
                        return { code: 'PROMO_WELCOME10', label: 'Promo WELCOME10', amountCents: amt }
                      }
                      if (uc === 'SAVE15') {
                        const amt = Math.round(baseCents * -0.15)
                        return { code: 'PROMO_SAVE15', label: 'Promo SAVE15', amountCents: amt }
                      }
                      return null
                    }
                  }
                })
                priceCents = price.totalCents
                priceCurrency = price.currency
              } catch (e) {
                // If pricing fails, continue without price to avoid failing availability
              }
            }
            daySlots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              available: true,
              ...(priceCents != null ? { priceCents, currency: priceCurrency } : {})
            })
          }
        }
      }

      if (daySlots.length > 0) {
        availability.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          slots: daySlots
        })
      }
    }

    return NextResponse.json({
      serviceId,
      duration,
      availability
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
