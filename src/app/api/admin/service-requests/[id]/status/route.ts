import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const runtime = 'nodejs'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { realtimeService } from '@/lib/realtime-enhanced'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond, zodDetails } from '@/lib/api-response'
import { getTenantFromRequest, isMultiTenancyEnabled } from '@/lib/tenant'
import { NextRequest } from 'next/server'

const Schema = z.object({ status: z.enum(['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED']) })

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.unauthorized()
  }

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:status:${id}:${ip}`, 30, 60_000)) {
    return respond.tooMany()
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', zodDetails(parsed.error))

  const tenantId = getTenantFromRequest(req as any)
  const canFind = typeof (prisma as any)?.serviceRequest?.findUnique === 'function'
  const existing = canFind ? await prisma.serviceRequest.findUnique({ where: { id } }) : null
  if (canFind && !existing) return respond.notFound('Service request not found')
  if (canFind && isMultiTenancyEnabled() && tenantId && (existing as any)?.tenantId && (existing as any).tenantId !== tenantId) {
    return respond.notFound('Service request not found')
  }

  const updated = await prisma.serviceRequest.update({
    where: { id: id },
    data: { status: parsed.data.status as any },
    include: { client: { select: { id: true, name: true, email: true } }, service: { select: { id: true, name: true } } }
  }) as any

  const safeUpdated: any = updated ?? { id, status: parsed.data.status, client: null, service: null }

  // Realtime broadcast
  try { realtimeService.emitServiceRequestUpdate(safeUpdated.id, { status: safeUpdated.status }) } catch {}
  try { if (safeUpdated.client?.id) realtimeService.broadcastToUser(String(safeUpdated.client.id), { type: 'service-request-updated', data: { serviceRequestId: safeUpdated.id, status: safeUpdated.status }, timestamp: new Date().toISOString() }) } catch {}
  try {
    const affectsAvailability = ['CANCELLED','COMPLETED'].includes(parsed.data.status as any)
    const wasBooking = !!(existing as any)?.isBooking || !!(existing as any)?.scheduledAt
    if (affectsAvailability && wasBooking && (existing as any)?.serviceId && (existing as any)?.scheduledAt) {
      const d = new Date((existing as any).scheduledAt).toISOString().slice(0,10)
      try { realtimeService.emitAvailabilityUpdate((existing as any).serviceId, { date: d }) } catch {}
    }
  } catch {}

  // Email client on status changes (best-effort)
  try {
    const to = safeUpdated.client?.email
    if (to) {
      await sendEmail({
        to,
        subject: `Request status updated to ${updated.status}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color:#2563eb;">Status Update</h2>
            <p>Hi ${updated.client?.name || to},</p>
            <p>Your service request "${updated.title}" status is now <strong>${updated.status.replace('_',' ')}</strong>.</p>
            <p><strong>Service:</strong> ${updated.service?.name || ''}</p>
            <p>You can review the latest activity and add comments in your client portal.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/portal/service-requests/${updated.id}" style="color:#2563eb;">Open request</a></p>
          </div>
        `
      })
    }
  } catch {}

  try { await logAudit({ action: 'service-request:status', actorId: (session.user as any).id ?? null, targetId: id, details: { status: safeUpdated.status } }) } catch {}
  return respond.ok(safeUpdated)
}
