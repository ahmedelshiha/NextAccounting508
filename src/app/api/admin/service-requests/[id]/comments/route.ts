import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { realtimeService } from '@/lib/realtime-enhanced'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const CreateCommentSchema = z.object({
  content: z.string().min(1),
  attachments: z.any().optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const comments = await prisma.serviceRequestComment.findMany({
    where: { serviceRequestId: params.id },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ success: true, data: comments })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(req)
  if (!rateLimit(`service-requests:comment:${params.id}:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
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

  realtimeService.emitServiceRequestUpdate(params.id, { commentId: created.id, event: 'comment-created' })

  try { await logAudit({ action: 'service-request:comment', actorId: (session.user as any).id ?? null, targetId: params.id, details: { commentId: created.id } }) } catch {}
  return NextResponse.json({ success: true, data: created }, { status: 201 })
}
