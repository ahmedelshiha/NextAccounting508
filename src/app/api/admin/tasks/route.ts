import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const where: any = {}
    if (status.length) where.status = { in: status.map(s => mapStatus(s)) }
    if (priority.length) where.priority = { in: priority.map(p => mapPriority(p)) }
    if (assigneeId) where.assigneeId = assigneeId
    if (q) where.title = { contains: q, mode: 'insensitive' }
    if (dueFrom || dueTo) {
      where.dueAt = {}
      if (dueFrom) where.dueAt.gte = new Date(dueFrom)
      if (dueTo) where.dueAt.lte = new Date(dueTo)
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: { [orderByField]: order },
      skip: offset,
      take: limit,
    })

    return NextResponse.json(tasks)
  } catch (err) {
    console.error('GET /api/admin/tasks error', err)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json().catch(() => null)
    const parsed = CreateSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

    const body = parsed.data
    const created = await prisma.task.create({
      data: {
        title: String(body.title),
        priority: (mapPriority(body.priority as any) || 'MEDIUM') as any,
        status: (mapStatus(body.status as any) || 'OPEN') as any,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        assigneeId: body.assigneeId ?? null,
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
}
