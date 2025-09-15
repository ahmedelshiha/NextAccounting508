import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || '50')))
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const skip = (page - 1) * limit

    // Basic filters (optional, non-breaking)
    const status = url.searchParams.getAll('status').map(s => String(s).toUpperCase())
    const priority = url.searchParams.getAll('priority').map(p => String(p).toUpperCase())
    const assignee = url.searchParams.getAll('assigneeId')
    const search = (url.searchParams.get('search') || '').trim()

    const where: any = {}
    if (status.length) where.status = { in: status }
    if (priority.length) where.priority = { in: priority }
    if (assignee.length) where.assigneeId = { in: assignee }
    if (search) where.title = { contains: search, mode: 'insensitive' }

    const tasks = await prisma.task.findMany({
      where,
      take: limit,
      skip,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (err) {
    console.error('GET /api/admin/tasks error', err)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.title) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const mapPriority = (p: any) => {
      const v = String(p || '').toUpperCase()
      if (v === 'LOW') return 'LOW'
      if (v === 'HIGH' || v === 'CRITICAL') return 'HIGH'
      return 'MEDIUM'
    }
    const mapStatus = (s: any) => {
      const v = String(s || '').toUpperCase()
      if (v === 'IN_PROGRESS') return 'IN_PROGRESS'
      if (v === 'DONE' || v === 'COMPLETED') return 'DONE'
      return 'OPEN'
    }

    const dueAt = (() => {
      try { return body.dueAt ? new Date(body.dueAt) : null } catch { return null }
    })()

    const created = await prisma.task.create({ data: ({
      title: String(body.title),
      priority: mapPriority(body.priority) as any,
      status: mapStatus(body.status) as any,
      dueAt,
      assigneeId: body.assigneeId ?? null,
    }) as any })

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
