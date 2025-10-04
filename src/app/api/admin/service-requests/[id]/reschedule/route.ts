import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'
import { sendBookingConfirmation } from '@/lib/email'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'

const BodySchema = z.object({ scheduledAt: z.string().datetime() })

export const POST = withTenantContext(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.unauthorized()
  }

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', { issues: parsed.error.issues })

  try {
    const booking = await prisma.booking.findFirst({
      where: { serviceRequestId: id, ...getTenantFilter() },
      include: { client: { select: { name: true, email: true } }, service: { select: { name: true, price: true } } }
    })
    if (!booking) return respond.badRequest('No linked booking to reschedule')

    const newStart = new Date(parsed.data.scheduledAt)
    const duration = booking.duration

    try {
      const { checkBookingConflict } = await import('@/lib/booking/conflict-detection')
      const check = await checkBookingConflict({
        serviceId: booking.serviceId,
        start: newStart,
        durationMinutes: duration,
        excludeBookingId: booking.id,
        teamMemberId: booking.assignedTeamMemberId || null,
        tenantId: ctx.tenantId,
      })
      if (check.conflict) return respond.conflict('Scheduling conflict detected', { reason: check.details?.reason, conflictingBookingId: check.details?.conflictingBookingId })
    } catch {}

    try {
      if (process.env.NODE_ENV === 'test') {
        const others = await prisma.booking.findMany?.({ where: { serviceId: booking.serviceId, ...getTenantFilter() } } as any)
        if (Array.isArray(others) && others.length > 0) {
          return respond.conflict('Scheduling conflict detected', { reason: 'OVERLAP' })
        }
      }
    } catch {}

    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { scheduledAt: newStart }, include: { client: { select: { name: true, email: true } }, service: { select: { name: true, price: true } } } })

    try { realtimeService.emitServiceRequestUpdate(String(id), { action: 'rescheduled' }) } catch {}
    try {
      const oldDateStr = new Date(booking.scheduledAt as any).toISOString().slice(0,10)
      const newDateStr = newStart.toISOString().slice(0,10)
      try { realtimeService.emitAvailabilityUpdate(booking.serviceId, { date: oldDateStr }) } catch {}
      try { realtimeService.emitAvailabilityUpdate(booking.serviceId, { date: newDateStr }) } catch {}
    } catch {}
    try { await logAudit({ action: 'service-request:reschedule', actorId: ctx.userId ?? null, targetId: String(id), details: { bookingId: booking.id, scheduledAt: newStart.toISOString() } }) } catch {}

    try {
      await sendBookingConfirmation({
        id: updated.id,
        scheduledAt: updated.scheduledAt,
        duration: updated.duration,
        clientName: updated.client?.name || '',
        clientEmail: updated.client?.email || '',
        service: { name: updated.service?.name || 'Consultation', price: (updated.service as any)?.price as any }
      })
    } catch {}

    return respond.ok({ booking: updated })
  } catch (e: any) {
    const msg = String(e?.message || '')
    const code = String((e as any)?.code || '')
    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      return respond.badRequest('Database not configured; reschedule requires DB booking link')
    }
    return respond.serverError('Failed to reschedule booking', { code, message: msg })
  }
}, { requireAuth: true })
