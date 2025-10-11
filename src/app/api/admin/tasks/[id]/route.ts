import prisma from '@/lib/prisma'
import { z } from 'zod'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { getTenantFilter, requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

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

export const GET = withTenantContext(async (request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
      return respond.forbidden('Forbidden')
    }

    const { id } = params
    const task = await prisma.task.findFirst({
      where: { id, ...getTenantFilter() },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(task)
  } catch (err) {
    console.error('GET /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_UPDATE)) {
      return respond.forbidden('Forbidden')
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

    // Perform tenant-scoped update
    const where = { id, ...getTenantFilter() }

    const result = await prisma.task.updateMany({ where, data: updates })
    if (result.count === 0) {
      return NextResponse.json({ error: 'Not found or not permitted' }, { status: 404 })
    }

    const updated = await prisma.task.findFirst({ where, include: { assignee: { select: { id: true, name: true, email: true } } } })

    try {
      const { broadcast } = await import('@/lib/realtime')
      try { if (updated) broadcast({ type: 'task.updated', payload: updated }) } catch(e) {}
    } catch (e) { /* best-effort */ }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_DELETE)) {
      return respond.forbidden('Forbidden')
    }

    const { id } = params
    const where = { id, ...getTenantFilter() }

    // Delete tenant-scoped
    const deleted = await prisma.task.deleteMany({ where })
    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Not found or not permitted' }, { status: 404 })
    }

    try {
      const { broadcast } = await import('@/lib/realtime')
      try { broadcast({ type: 'task.deleted', payload: { id } }) } catch (e) {}
    } catch (e) { /* best-effort */ }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
})
