import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { taskUpdateSchema } from '@/lib/validation'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// PATCH /api/admin/tasks/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const ip = getClientIp(request as unknown as Request)
    if (!rateLimit(`tasks:update:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const json = await request.json().catch(() => ({}))
    const parsed = taskUpdateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const data: import('@prisma/client').Prisma.TaskUpdateInput = {}
    if (parsed.data.title !== undefined) data.title = parsed.data.title
    if (parsed.data.status !== undefined) data.status = parsed.data.status
    if (parsed.data.priority !== undefined) data.priority = parsed.data.priority
    if (parsed.data.dueAt !== undefined) data.dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null
    if (parsed.data.position !== undefined) data.position = parsed.data.position as number
    if (parsed.data.boardStatus !== undefined) {
      data.boardStatus = parsed.data.boardStatus as string
      // keep coarse status synced with board column
      const mapped = parsed.data.boardStatus === 'completed' ? 'DONE' : parsed.data.boardStatus === 'in_progress' ? 'IN_PROGRESS' : 'OPEN'
      data.status = mapped as any
    }

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

// DELETE /api/admin/tasks/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const ip = getClientIp(request as unknown as Request)
    if (!rateLimit(`tasks:delete:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
