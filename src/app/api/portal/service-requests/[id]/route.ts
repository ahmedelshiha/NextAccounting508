import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { respond } from '@/lib/api-response'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return respond.unauthorized()
  }

  const item = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      service: { select: { id: true, name: true, slug: true, category: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!item || item.clientId !== session.user.id) {
    return respond.notFound('Service request not found')
  }

  return respond.ok(item)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return respond.unauthorized()
  }

  // Allow client to perform limited updates like adding description or cancelling (if allowed)
  const ip = getClientIp(req)
  if (!rateLimit(`portal:service-requests:update:${ip}`, 10, 60_000)) {
    return respond.tooMany()
  }
  const body = await req.json().catch(() => ({} as any))
  const allowed: any = {}
  if (typeof body.description === 'string') allowed.description = body.description
  if (body.action === 'cancel') allowed.status = 'CANCELLED'

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true, status: true } })
  if (!existing || existing.clientId !== session.user.id) {
    return respond.notFound('Service request not found')
  }
  if (body.action === 'approve') {
    if (['CANCELLED','COMPLETED'].includes(existing.status as any)) {
      return respond.badRequest('Cannot approve at current status')
    }
    if (!['SUBMITTED','IN_REVIEW','APPROVED'].includes(existing.status as any)) {
      return respond.badRequest('Approval not applicable')
    }
    allowed.clientApprovalAt = new Date()
    allowed.status = 'APPROVED'
  }
  if (allowed.status === 'CANCELLED' && ['IN_PROGRESS','COMPLETED','CANCELLED'].includes(existing.status as any)) {
    return respond.badRequest('Cannot cancel at current status')
  }

  const updated = await prisma.serviceRequest.update({ where: { id: params.id }, data: allowed })
  return respond.ok(updated)
}
