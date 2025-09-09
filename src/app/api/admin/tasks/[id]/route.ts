import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PATCH /api/admin/tasks/[id]
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const data: import('@prisma/client').Prisma.TaskUpdateInput = {}
    if (body.title !== undefined) data.title = String(body.title)
    if (body.status !== undefined) data.status = body.status
    if (body.priority !== undefined) data.priority = body.priority
    if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const updated = await prisma.task.update({ where: { id }, data })
    return NextResponse.json({ task: updated })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
