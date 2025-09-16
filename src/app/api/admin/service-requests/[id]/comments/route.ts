import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond, zodDetails } from '@/lib/api-response'

const CreateCommentSchema = z.object({
  content: z.string().min(1),
  attachments: z.any().optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return respond.unauthorized()
  }

  const comments = await prisma.serviceRequestComment.findMany({
    where: { serviceRequestId: params.id },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return respond.ok(comments)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return respond.unauthorized()
  }

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:comment:${params.id}:${ip}`, 30, 60_000)) {
    return respond.tooMany()
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateCommentSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  const created = await prisma.serviceRequestComment.create({
    data: {
      serviceRequestId: params.id,
      authorId: (session.user as any).id ?? null,
      content: parsed.data.content,
      attachments: parsed.data.attachments ?? undefined,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  try { realtimeService.emitServiceRequestUpdate(params.id, { commentId: created.id, event: 'comment-created' }) } catch {}
  try {
    const sr = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true } })
    if (sr?.clientId) {
      realtimeService.broadcastToUser(String(sr.clientId), { type: 'service-request-updated', data: { serviceRequestId: params.id, commentId: created.id, event: 'comment-created' }, timestamp: new Date().toISOString() })
    }
  } catch {}

  try { await logAudit({ action: 'service-request:comment', actorId: (session.user as any).id ?? null, targetId: params.id, details: { commentId: created.id } }) } catch {}
  return respond.created(created)
}
