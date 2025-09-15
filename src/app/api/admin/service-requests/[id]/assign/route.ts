import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({ teamMemberId: z.string().min(1) })

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['ADMIN','STAFF'].includes((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  })

  return NextResponse.json({ success: true, data: updated })
}
