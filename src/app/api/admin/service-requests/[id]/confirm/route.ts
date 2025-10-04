import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'
import { sendBookingConfirmation } from '@/lib/email'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (_req: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.unauthorized()
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: { serviceRequestId: id, ...getTenantFilter() },
      include: { client: { select: { name: true, email: true } }, service: { select: { name: true, price: true } } }
    })
    if (!booking) return respond.badRequest('No linked booking to confirm')

    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED', confirmed: true } as any, include: { client: { select: { name: true, email: true } }, service: { select: { name: true, price: true } } } })

    try { realtimeService.emitServiceRequestUpdate(String(id), { action: 'confirmed' }) } catch {}
    try { await logAudit({ action: 'service-request:confirm', actorId: ctx.userId ?? null, targetId: String(id), details: { bookingId: booking.id } }) } catch {}

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
      return respond.badRequest('Database not configured; confirmation requires DB booking link')
    }
    return respond.serverError('Failed to confirm booking', { code, message: msg })
  }
})
