import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { taskCreateSchema } from '@/lib/validation'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/tasks?limit=10&q=search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const q = (searchParams.get('q') || '').trim()
    const pageParam = searchParams.get('page')
    const page = pageParam ? Math.max(parseInt(pageParam, 10) || 1, 1) : 1
    const take = limitParam ? Math.min(parseInt(limitParam, 10) || 10, 100) : 10
    const skip = (page - 1) * take

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      const fallback = [
        { id: 't1', title: 'Send monthly newsletters', dueAt: null, priority: 'HIGH', status: 'OPEN', assigneeId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 't2', title: 'Review pending bookings', dueAt: null, priority: 'MEDIUM', status: 'OPEN', assigneeId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 't3', title: 'Update service pricing', dueAt: null, priority: 'LOW', status: 'IN_PROGRESS', assigneeId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]

      const results = q ? fallback.filter((t) => t.title.toLowerCase().includes(q.toLowerCase())) : fallback
      const pageItems = results.slice(skip, skip + take)
      return NextResponse.json({ tasks: pageItems, pagination: { total: results.length, page, limit: take } })
    }

    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: [
          { boardStatus: 'asc' },
          { position: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take,
        select: { id: true, title: true, dueAt: true, priority: true, status: true, boardStatus: true, position: true, assigneeId: true, createdAt: true, updatedAt: true }
      })
    ])

    return NextResponse.json({ tasks, pagination: { total, page, limit: take } })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/admin/tasks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request as unknown as Request)
    if (!rateLimit(`tasks:create:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const json = await request.json().catch(() => ({}))
    const parsed = taskCreateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const title = parsed.data.title
    const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null
    const priority = (parsed.data.priority || 'MEDIUM') as import('@prisma/client').TaskPriority

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const task = await prisma.task.create({ data: { title, dueAt, priority } })
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
