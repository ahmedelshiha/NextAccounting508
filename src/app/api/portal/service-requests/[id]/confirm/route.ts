export const runtime = 'nodejs'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { logAudit } from '@/lib/audit'
import { sendBookingConfirmation } from '@/lib/email'
import { getTenantFromRequest, isMultiTenancyEnabled } from '@/lib/tenant'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return respond.unauthorized()

  const tenantId = getTenantFromRequest(req as any)

  try {
    const sr = await prisma.serviceRequest.findUnique({ where: { id }, select: { id: true, clientId: true, tenantId: true } })
    if (!sr || sr.clientId !== session.user.id) return respond.notFound('Service request not found')
    if (isMultiTenancyEnabled() && tenantId && (sr as any).tenantId && (sr as any).tenantId !== tenantId) return respond.notFound('Service request not found')

    const booking = await prisma.booking.findFirst({ where: { serviceRequestId: id }, include: { client: { select: { name: true, email: true } }, service: { select: { name: true, price: true } } } })
    if (!booking) return respond.badRequest('No linked booking to confirm')

    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED', confirmed: true } as any, include: { client: { select: { name: true, email: true } }, service: { select: { name: true, price: true } } } })

    try { await logAudit({ action: 'portal:service-request:confirm', actorId: session.user.id ?? null, targetId: String(id), details: { bookingId: booking.id } }) } catch {}

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

    // Persist scheduled reminders based on user preferences (if DB available)
    try {
      const prefs = await prisma.bookingPreferences.findUnique({ where: { userId: String(updated.clientId) } }).catch(() => null)
      const reminderHours = Array.isArray(prefs?.reminderHours) && prefs!.reminderHours.length > 0 ? prefs!.reminderHours : [24, 2]
      const now = new Date()
      for (const h of reminderHours) {
        try {
          const scheduledAt = new Date(updated.scheduledAt.getTime() - Number(h) * 60 * 60 * 1000)
          if (scheduledAt > now) {
            // Avoid duplicates by checking existing similar reminders
            const exists = await prisma.scheduledReminder.findFirst({ where: { serviceRequestId: id, scheduledAt } }).catch(() => null)
            if (!exists) {
              const tId = (updated as any).tenantId || undefined
              await prisma.scheduledReminder.create({ data: { serviceRequestId: id, scheduledAt, channel: 'EMAIL', tenantId: tId } }).catch(() => null)
            }
          }
        } catch {}
      }

      // Optionally schedule SMS reminders if user opted-in
      if (prefs?.smsReminder) {
        for (const h of reminderHours) {
          try {
            const scheduledAt = new Date(updated.scheduledAt.getTime() - Number(h) * 60 * 60 * 1000)
            if (scheduledAt > now) {
              const exists = await prisma.scheduledReminder.findFirst({ where: { serviceRequestId: id, scheduledAt, channel: 'SMS' } }).catch(() => null)
              if (!exists) {
                const tId = (updated as any).tenantId || undefined
                await prisma.scheduledReminder.create({ data: { serviceRequestId: id, scheduledAt, channel: 'SMS', tenantId: tId } }).catch(() => null)
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      // non-fatal
    }

    return respond.ok({ booking: updated })
  } catch (e: any) {
    const msg = String(e?.message || '')
    const code = String((e as any)?.code || '')
    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      // Dev fallback: mark SR as confirmed metadata
      try {
        const { getRequest, updateRequest } = await import('@/lib/dev-fallbacks')
        const existing = getRequest(id)
        if (!existing || existing.clientId !== session?.user?.id) return respond.notFound('Service request not found')
        const updated = updateRequest(id, { confirmed: true, updatedAt: new Date().toISOString() })
        return respond.ok({ serviceRequest: updated })
      } catch {
        return respond.badRequest('Database not configured; confirmation requires booking link')
      }
    }
    return respond.serverError('Failed to confirm booking', { code, message: msg })
  }
}
