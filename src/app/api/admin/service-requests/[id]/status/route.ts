import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { realtimeService } from '@/lib/realtime-enhanced'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const Schema = z.object({ status: z.enum(['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED']) })

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:status:${params.id}:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.serviceRequest.update({
    where: { id: params.id },
    data: { status: parsed.data.status as any },
    include: { client: { select: { id: true, name: true, email: true } }, service: { select: { id: true, name: true } } }
  })

  // Realtime broadcast
  try { realtimeService.emitServiceRequestUpdate(updated.id, { status: updated.status }) } catch {}

  // Email client on status changes (best-effort)
  try {
    const to = updated.client?.email
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

  return NextResponse.json({ success: true, data: updated })
}
