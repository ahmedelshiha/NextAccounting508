import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { isMultiTenancyEnabled } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { getTenantFilter, requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

// In-memory fallback store (non-persistent) used only when DB is not configured
const mem: { tasks: any[] } = { tasks: [] }

const PriorityEnum = z.enum(['LOW','MEDIUM','HIGH'])
const StatusEnum = z.enum(['OPEN','IN_PROGRESS','DONE'])

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
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

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
      return respond.forbidden('Forbidden')
    }

    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 500)
    const offset = Math.max(Number(url.searchParams.get('offset') || '0'), 0)
    const status = url.searchParams.getAll('status')
    const priority = url.searchParams.getAll('priority')
    const assigneeId = url.searchParams.get('assigneeId')
    const q = url.searchParams.get('q')?.trim()
    const dueFrom = url.searchParams.get('dueFrom')
    const dueTo = url.searchParams.get('dueTo')
    const orderByField = (url.searchParams.get('orderBy') || 'updatedAt') as 'createdAt'|'updatedAt'|'dueAt'
    const order = (url.searchParams.get('order') || 'desc') as 'asc'|'desc'

    if (!hasDb) {
      let rows = mem.tasks.slice()
      if (status.length) {
        const set = new Set(status.map(s => mapStatus(s)))
        rows = rows.filter(r => set.has(r.status))
      }
      if (priority.length) {
        const set = new Set(priority.map(p => mapPriority(p)))
        rows = rows.filter(r => set.has(r.priority))
      }
      if (assigneeId) rows = rows.filter(r => r.assigneeId === assigneeId)
      if (q) rows = rows.filter(r => (r.title || '').toLowerCase().includes(q.toLowerCase()))
      if (dueFrom || dueTo) {
        rows = rows.filter(r => {
          const d = r.dueAt ? new Date(r.dueAt) : null
          if (!d) return false
          if (dueFrom && d < new Date(dueFrom)) return false
          if (dueTo && d > new Date(dueTo)) return false
          return true
        })
      }
      rows.sort((a, b) => {
        const av = new Date(a[orderByField] || 0).getTime()
        const bv = new Date(b[orderByField] || 0).getTime()
        return order === 'asc' ? av - bv : bv - av
      })
      const paged = rows.slice(offset, offset + limit)
      // mimic include: { assignee }
      return NextResponse.json(paged)
    }

    const where: any = { ...(getTenantFilter() as any) }
    if (status.length) where.status = { in: status.map(s => mapStatus(s)) }
    if (priority.length) where.priority = { in: priority.map(p => mapPriority(p)) }
    if (assigneeId) where.assigneeId = assigneeId
    if (q) where.title = { contains: q, mode: 'insensitive' }
    if (dueFrom || dueTo) {
      where.dueAt = {}
      if (dueFrom) where.dueAt.gte = new Date(dueFrom)
      if (dueTo) where.dueAt.lte = new Date(dueTo)
    }

    let tasks
    try {
      tasks = await prisma.task.findMany({
        where,
        include: { assignee: { select: { id: true, name: true, email: true } } },
        orderBy: { [orderByField]: order },
        skip: offset,
        take: limit,
      })
    } catch (e: any) {
      // If DB/schema missing, fallback to demo in-memory tasks to avoid crashing admin UI
      const code = String(e?.code || '')
      const msg = String(e?.message || '')
      if (code.startsWith('P10') || code.startsWith('P20') || /relation|table|column/i.test(msg)) {
        console.warn('Prisma schema missing or DB unavailable, returning demo tasks fallback', msg)
        const fallback = [
          { id: 'demo-1', title: 'Demo task 1', priority: 'MEDIUM', status: 'OPEN', dueAt: null, assignee: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 'demo-2', title: 'Demo task 2', priority: 'HIGH', status: 'IN_PROGRESS', dueAt: null, assignee: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
        return NextResponse.json(fallback)
      }
      throw e
    }

    return NextResponse.json(tasks)
  } catch (err) {
    console.error('GET /api/admin/tasks error', err)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_CREATE)) {
      return respond.forbidden('Forbidden')
    }

    const json = await request.json().catch(() => null)
    const parsed = CreateSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

    const body = parsed.data

    if (!hasDb) {
      const now = new Date()
      const id = (globalThis as any).crypto && typeof (globalThis as any).crypto.randomUUID === 'function'
        ? (globalThis as any).crypto.randomUUID()
        : Math.random().toString(36).slice(2)
      const row = {
        id,
        title: String(body.title),
        priority: (mapPriority(body.priority as any) || 'MEDIUM'),
        status: (mapStatus(body.status as any) || 'OPEN'),
        dueAt: body.dueAt ? new Date(body.dueAt).toISOString() : null,
        assigneeId: body.assigneeId ?? null,
        assignee: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
      mem.tasks.unshift(row)
      try {
        const { broadcast } = await import('@/lib/realtime')
        broadcast({ type: 'task.created', payload: row })
      } catch {}
      return NextResponse.json(row, { status: 201 })
    }

    const tenantId = ctx.tenantId

    const created = await prisma.task.create({
      data: {
        title: String(body.title),
        priority: (mapPriority(body.priority as any) || 'MEDIUM') as any,
        status: (mapStatus(body.status as any) || 'OPEN') as any,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        assigneeId: body.assigneeId ?? null,
        ...(isMultiTenancyEnabled() && tenantId ? { tenantId } : {}),
      } as any,
      include: { assignee: { select: { id: true, name: true, email: true } } },
    })

    try {
      const { broadcast } = await import('@/lib/realtime')
      broadcast({ type: 'task.created', payload: created })
    } catch (e) { /* best-effort */ }

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/tasks error', err)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
})
