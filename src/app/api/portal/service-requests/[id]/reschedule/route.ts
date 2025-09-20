export const runtime = 'nodejs'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { sendBookingConfirmation } from '@/lib/email'

const BodySchema = z.object({ scheduledAt: z.string().datetime() })

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return respond.unauthorized()

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', { issues: parsed.error.issues })

  try {
    const sr = await prisma.serviceRequest.findUnique({ where: { id }, select: { id: true, clientId: true } })
    if (!sr || sr.clientId !== session.user.id) return respond.notFound('Service request not found')

    const booking = await prisma.booking.findFirst({ where: { serviceRequestId: id } })
    if (!booking) return respond.badRequest('No linked booking to reschedule')

    const newStart = new Date(parsed.data.scheduledAt)
    const duration = booking.duration
    const newEnd = new Date(newStart.getTime() + duration * 60_000)

    const conflict = await prisma.booking.findFirst({
      where: {
        id: { not: booking.id },
        serviceId: booking.serviceId,
        scheduledAt: { lt: newEnd },
        status: { in: ['PENDING','CONFIRMED'] as any },
        AND: { scheduledAt: { gte: new Date(newStart.getTime() - 60 * 60_000) } },
      },
    })
    if (conflict) return respond.badRequest('Scheduling conflict detected')

    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { scheduledAt: newStart }, include: { client: { select: { name: true, email: true } }, service: { select: { name: true, price: true } } } })

    try { await logAudit({ action: 'portal:service-request:reschedule', actorId: session.user.id ?? null, targetId: String(id), details: { bookingId: booking.id, scheduledAt: newStart.toISOString() } }) } catch {}

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
      // Dev fallback: update SR scheduledAt
      try {
        const { getRequest, updateRequest } = await import('@/lib/dev-fallbacks')
        const existing = getRequest(id)
        if (!existing || existing.clientId !== session?.user?.id) return respond.notFound('Service request not found')
        const updated = updateRequest(id, { scheduledAt: new Date(parsed.data.scheduledAt).toISOString(), updatedAt: new Date().toISOString() })
        return respond.ok({ serviceRequest: updated })
      } catch {
        return respond.badRequest('Database not configured; reschedule requires booking link')
      }
    }
    return respond.serverError('Failed to reschedule booking', { code, message: msg })
  }
}
