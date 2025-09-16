import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function POST(request: Request, context: any) {
  const params = context?.params || context
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.TASKS_ASSIGN)) {
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
