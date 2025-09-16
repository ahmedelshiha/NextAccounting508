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

const Schema = z.object({ teamMemberId: z.string().min(1) })

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_ASSIGN)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:assign:${params.id}:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

  const tm = await prisma.teamMember.findUnique({ where: { id: parsed.data.teamMemberId } })
  if (!tm) return NextResponse.json({ error: 'Team member not found' }, { status: 404 })

  const updated = await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      assignedTeamMemberId: tm.id,
      assignedAt: new Date(),
      assignedBy: (session.user as any).id ?? null,
      status: 'ASSIGNED' as any,
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true } },
    }
  })

  // Fire realtime event
  try { realtimeService.emitTeamAssignment({ serviceRequestId: updated.id, teamMemberId: tm.id }) } catch {}
  try { realtimeService.emitServiceRequestUpdate(updated.id, { status: 'ASSIGNED' }) } catch {}
  try { if (updated.client?.id) realtimeService.broadcastToUser(String(updated.client.id), { type: 'service-request-updated', data: { serviceRequestId: updated.id, status: 'ASSIGNED' }, timestamp: new Date().toISOString() }) } catch {}

  // Email notifications (best-effort)
  try {
    if (updated.client?.email) {
      await sendEmail({
        to: updated.client.email,
        subject: `Your request has been assigned - ${updated.service?.name || ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color:#2563eb;">Request Assigned</h2>
            <p>Hi ${updated.client.name || updated.client.email},</p>
            <p>Your service request "${updated.title}" has been assigned to a specialist and is now in progress.</p>
            <p><strong>Service:</strong> ${updated.service?.name || ''}</p>
            <p>You can view the request and leave comments in your client portal.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/portal/service-requests/${updated.id}" style="color:#2563eb;">Open request</a></p>
          </div>
        `
      })
    }
  } catch {}

  try { await logAudit({ action: 'service-request:assign', actorId: (session.user as any).id ?? null, targetId: params.id, details: { teamMemberId: tm.id } }) } catch {}
  return NextResponse.json({ success: true, data: updated })
}
