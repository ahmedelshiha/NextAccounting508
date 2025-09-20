import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'
import { sendBookingConfirmation } from '@/lib/email'

const BodySchema = z.object({ scheduledAt: z.string().datetime() })

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.unauthorized()
  }

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', { issues: parsed.error.issues })

  try {
    const booking = await prisma.booking.findFirst({ where: { serviceRequestId: id }, include: { client: { select: { name: true, email: true } }, service: { select: { name: true, price: true } } } })
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

    try { realtimeService.emitServiceRequestUpdate(String(id), { action: 'rescheduled' }) } catch {}
    try { await logAudit({ action: 'service-request:reschedule', actorId: (session.user as any).id ?? null, targetId: String(id), details: { bookingId: booking.id, scheduledAt: newStart.toISOString() } }) } catch {}

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
}
