import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const PriorityEnum = z.enum(['LOW','MEDIUM','HIGH'])
const StatusEnum = z.enum(['OPEN','IN_PROGRESS','DONE'])
const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  priority: z.union([PriorityEnum, z.enum(['low','medium','high','critical'])]).optional(),
  status: z.union([StatusEnum, z.enum(['pending','in_progress','completed'])]).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
})

function mapPriority(v?: string | null) {
  if (!v) return undefined
  const s = String(v).toUpperCase()
  if (s === 'LOW') return 'LOW'
  if (s === 'HIGH' || s === 'CRITICAL') return 'HIGH'
  return 'MEDIUM'
}
function mapStatus(v?: string | null) {
  if (!v) return undefined
  const s = String(v).toUpperCase()
  if (s === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (s === 'DONE' || s === 'COMPLETED') return 'DONE'
  return 'OPEN'
}

export async function GET(request: Request, context: any) {
  const params = context?.params || context
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = params
    const task = await prisma.task.findUnique({ where: { id }, include: { assignee: { select: { id: true, name: true, email: true } } } })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(task)
  } catch (err) {
    console.error('GET /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: any) {
  const params = context?.params || context
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const json = await request.json().catch(() => null)
    const parsed = UpdateSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    const body = parsed.data

    const updates: any = {}
    if (body.title !== undefined) updates.title = String(body.title)
    if (body.priority !== undefined) updates.priority = mapPriority(body.priority) as any
    if (body.status !== undefined) updates.status = mapStatus(body.status) as any
    if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null
    if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId || null

    const updated = await prisma.task.update({ where: { id }, data: updates, include: { assignee: { select: { id: true, name: true, email: true } } } })
    try {
      const { broadcast } = await import('@/lib/realtime')
      try { broadcast({ type: 'task.updated', payload: updated }) } catch(e) {}
    } catch (e) { /* best-effort */ }
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: any) {
  const params = context?.params || context
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = params
    const deleted = await prisma.task.delete({ where: { id } })
    try {
      const { broadcast } = await import('@/lib/realtime')
      broadcast({ type: 'task.deleted', payload: { id } })
    } catch (e) { /* best-effort */ }
    return NextResponse.json({ ok: true, deleted })
  } catch (err) {
    console.error('DELETE /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
