export const runtime = 'nodejs'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { logAudit } from '@/lib/audit'
import { sendBookingConfirmation } from '@/lib/email'

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return respond.unauthorized()

  try {
    const sr = await prisma.serviceRequest.findUnique({ where: { id }, select: { id: true, clientId: true } })
    if (!sr || sr.clientId !== session.user.id) return respond.notFound('Service request not found')

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
