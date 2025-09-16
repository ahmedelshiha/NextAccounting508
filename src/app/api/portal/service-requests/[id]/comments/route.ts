import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

const CreateSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.any().optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reqRow = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true } })
  if (!reqRow || reqRow.clientId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const comments = await prisma.serviceRequestComment.findMany({
    where: { serviceRequestId: params.id },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ success: true, data: comments })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reqRow = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true } })
  if (!reqRow || reqRow.clientId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ip = getClientIp(req)
  if (!rateLimit(`portal:service-requests:comment:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const created = await prisma.serviceRequestComment.create({
    data: {
      serviceRequestId: params.id,
      authorId: session.user.id,
      content: parsed.data.content,
      attachments: parsed.data.attachments ?? undefined,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ success: true, data: created }, { status: 201 })
}
