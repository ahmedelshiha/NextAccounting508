import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import { getAvailabilityForService } from '@/lib/booking/availability'
import { z } from 'zod'

const QuerySchema = z.object({
  serviceId: z.string().min(1),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  duration: z.coerce.number().min(15).max(8 * 60).optional(),
  teamMemberId: z.string().optional(),
  includePrice: z.enum(['1','true']).optional(),
  currency: z.string().optional(),
})

type Slot = { start: string; end: string; available: boolean }

function generateSlots(start: Date, end: Date, minutes: number): { start: Date; end: Date }[] {
  const slots: { start: Date; end: Date }[] = []
  const cur = new Date(start)
  while (cur < end) {
    const s = new Date(cur)
    const e = new Date(cur.getTime() + minutes * 60_000)
    if (e > end) break
    slots.push({ start: s, end: e })
    cur.setMinutes(cur.getMinutes() + minutes)
  }
  return slots
}

function isOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return respond.unauthorized()
  }

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    serviceId: url.searchParams.get('serviceId') || '',
    dateFrom: url.searchParams.get('dateFrom') || '',
    dateTo: url.searchParams.get('dateTo') || '',
    duration: url.searchParams.get('duration') || undefined,
    teamMemberId: url.searchParams.get('teamMemberId') || undefined,
    includePrice: url.searchParams.get('includePrice') || undefined,
    currency: url.searchParams.get('currency') || undefined,
  })
  if (!parsed.success) return respond.badRequest('Invalid query', { issues: parsed.error.issues })

  const { serviceId, dateFrom, dateTo, duration, teamMemberId, includePrice, currency } = parsed.data

  try {
    const from = new Date(dateFrom)
    const to = new Date(dateTo)
    const { slots } = await getAvailabilityForService({ serviceId, from, to, slotMinutes: duration, teamMemberId })

    if (includePrice) {
      const { calculateServicePrice } = await import('@/lib/booking/pricing')
      const svc = await prisma.service.findUnique({ where: { id: serviceId } })
      const slotMinutes = duration ?? Math.max(15, svc?.duration ?? 60)
      const enriched = await Promise.all(slots.map(async (s) => {
        const breakdown = await calculateServicePrice({ serviceId, scheduledAt: new Date(s.start), durationMinutes: slotMinutes, options: { currency } })
        return { ...s, priceCents: breakdown.totalCents, currency: breakdown.currency }
      }))
      return respond.ok({ slots: enriched })
    }
    return respond.ok({ slots })
  } catch (e: any) {
    const msg = String(e?.message || '')
    const code = String((e as any)?.code || '')
    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      try {
        const from = new Date(dateFrom)
        const to = new Date(dateTo)
        const slotMinutes = duration ?? 60
        const days: Slot[] = []
        const workStartHour = 9
        const workEndHour = 17
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          const dayStart = new Date(d)
          dayStart.setHours(workStartHour, 0, 0, 0)
          const dayEnd = new Date(d)
          dayEnd.setHours(workEndHour, 0, 0, 0)
          const slots = generateSlots(dayStart, dayEnd, slotMinutes)
          for (const s of slots) days.push({ start: s.start.toISOString(), end: s.end.toISOString(), available: true })
        }
        return respond.ok({ slots: days })
      } catch {
        return respond.serverError()
      }
    }
    return respond.serverError('Failed to compute availability', { code, message: msg })
  }
}
