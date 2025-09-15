import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request, context: any) {
  const params = context?.params || context
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json().catch(() => ({}))
    const assigneeId = body.assigneeId ?? null
    const updated = await prisma.task.update({ where: { id }, data: { assigneeId }, include: { assignee: { select: { id: true, name: true, email: true } } } })
    try {
      const { broadcast } = await import('@/lib/realtime')
      broadcast({ type: 'task.updated', payload: updated })
    } catch (e) {}
    return NextResponse.json(updated)
  } catch (err) {
    console.error('POST /api/admin/tasks/[id]/assign error', err)
    return NextResponse.json({ error: 'Failed to assign' }, { status: 500 })
  }
}
