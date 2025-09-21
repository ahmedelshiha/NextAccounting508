import prisma from '@/lib/prisma'
import { addMinutes } from './availability'
import prisma from '@/lib/prisma'

export type ConflictReason = 'SERVICE_INACTIVE' | 'OVERLAP' | 'DAILY_CAP' | 'OUTSIDE_BUSINESS_HOURS'

export type ConflictDetails = {
  reason: ConflictReason
  conflictingBookingId?: string
  info?: Record<string, unknown>
}

export type CheckConflictParams = {
  serviceId: string
  start: Date
  durationMinutes: number
  excludeBookingId?: string
  teamMemberId?: string | null
  tenantId?: string | null
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export async function checkBookingConflict(params: CheckConflictParams): Promise<{ conflict: boolean; details?: ConflictDetails }> {
  const { serviceId, start, durationMinutes, excludeBookingId, teamMemberId } = params

  const svc = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!svc || svc.active === false || (svc as any).bookingEnabled === false) {
    return { conflict: true, details: { reason: 'SERVICE_INACTIVE' } }
  }

  const buffer = typeof svc.bufferTime === 'number' ? svc.bufferTime : (svc.bufferTime as any) ?? 0
  const maxDaily = typeof svc.maxDailyBookings === 'number' ? (svc.maxDailyBookings as number) : 0
  const startDt = new Date(start)
  const endDt = addMinutes(startDt, durationMinutes)

  // Fetch potentially conflicting bookings in an expanded window to allow client-side duration checks
  const windowStart = addMinutes(startOfDay(startDt), -Math.max(60, buffer))
  const windowEnd = addMinutes(endOfDay(startDt), Math.max(60, buffer))

  const bookings = await prisma.booking.findMany({
    where: {
      serviceId,
      status: { in: ['PENDING', 'CONFIRMED'] as any },
      scheduledAt: { gte: windowStart, lte: windowEnd },
      ...(teamMemberId ? { assignedTeamMemberId: teamMemberId } : {}),
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true, scheduledAt: true, duration: true },
  })

  const busy = bookings.map((b) => ({
    id: b.id,
    start: addMinutes(new Date(b.scheduledAt), -buffer),
    end: addMinutes(addMinutes(new Date(b.scheduledAt), b.duration), buffer),
  }))

  // Daily cap: include the new booking as well when comparing
  if (maxDaily && maxDaily > 0) {
    const dayStart = startOfDay(startDt)
    const dayEnd = endOfDay(startDt)
    const countToday = bookings.filter((b) => overlaps(new Date(b.scheduledAt), addMinutes(new Date(b.scheduledAt), b.duration), dayStart, dayEnd)).length
    if (countToday >= maxDaily) {
      return { conflict: true, details: { reason: 'DAILY_CAP', info: { maxDaily } } }
    }
  }

  const conflictWith = busy.find((b) => overlaps(startDt, endDt, b.start, b.end))
  if (conflictWith) {
    return { conflict: true, details: { reason: 'OVERLAP', conflictingBookingId: conflictWith.id } }
  }

  return { conflict: false }
}
