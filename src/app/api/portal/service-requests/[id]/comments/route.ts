import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { respond, zodDetails } from '@/lib/api-response'

const CreateSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.any().optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return respond.unauthorized()

  const reqRow = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true } })
  if (!reqRow || reqRow.clientId !== session.user.id) {
    return respond.notFound('Service request not found')
  }

  const comments = await prisma.serviceRequestComment.findMany({
    where: { serviceRequestId: params.id },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  return respond.ok(comments)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return respond.unauthorized()

  const reqRow = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true } })
  if (!reqRow || reqRow.clientId !== session.user.id) {
    return respond.notFound('Service request not found')
  }

  const ip = getClientIp(req)
  if (!rateLimit(`portal:service-requests:comment:${ip}`, 10, 60_000)) {
    return respond.tooMany()
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
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

  return respond.created(created)
}
