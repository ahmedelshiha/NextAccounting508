import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.unauthorized()
  }

  try {
    const booking = await prisma.booking.findFirst({ where: { serviceRequestId: id } })
    if (!booking) return respond.badRequest('No linked booking to confirm')

    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED', confirmed: true } as any })

    try { realtimeService.emitServiceRequestUpdate(String(id), { action: 'confirmed' }) } catch {}
    try { await logAudit({ action: 'service-request:confirm', actorId: (session.user as any).id ?? null, targetId: String(id), details: { bookingId: booking.id } }) } catch {}

    return respond.ok({ booking: updated })
  } catch (e: any) {
    const msg = String(e?.message || '')
    const code = String((e as any)?.code || '')
    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      return respond.badRequest('Database not configured; confirmation requires DB booking link')
    }
    return respond.serverError('Failed to confirm booking', { code, message: msg })
  }
}
