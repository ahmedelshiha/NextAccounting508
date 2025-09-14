import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') || '50')
    const tasks = await prisma.task.findMany({ take: limit, orderBy: { updatedAt: 'desc' } })
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

    const created = await prisma.task.create({ data: ({
      title: String(body.title),
      description: body.description ?? null,
      priority: (body.priority || 'MEDIUM') as any,
      status: (body.status || 'PENDING') as any,
      category: body.category ?? 'system',
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      estimatedHours: Number(body.estimatedHours || 0),
      assigneeId: body.assigneeId ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      complianceRequired: Boolean(body.complianceRequired || false),
      complianceDeadline: body.complianceDeadline ? new Date(body.complianceDeadline) : null,
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
