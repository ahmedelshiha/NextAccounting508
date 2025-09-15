import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: item })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow client to perform limited updates like adding description or cancelling (if allowed)
  const body = await req.json().catch(() => ({} as any))
  const allowed: any = {}
  if (typeof body.description === 'string') allowed.description = body.description
  if (body.action === 'cancel') allowed.status = 'CANCELLED'

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id }, select: { clientId: true, status: true } })
  if (!existing || existing.clientId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (allowed.status === 'CANCELLED' && ['IN_PROGRESS','COMPLETED','CANCELLED'].includes(existing.status as any)) {
    return NextResponse.json({ error: 'Cannot cancel at current status' }, { status: 400 })
  }

  const updated = await prisma.serviceRequest.update({ where: { id: params.id }, data: allowed })
  return NextResponse.json({ success: true, data: updated })
}
