import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({ status: z.enum(['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED']) })

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['ADMIN','STAFF'].includes((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.serviceRequest.update({ where: { id: params.id }, data: { status: parsed.data.status as any } })
  return NextResponse.json({ success: true, data: updated })
}
