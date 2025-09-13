import { NextResponse } from 'next/server'
import { prisma } from '../../../../prisma/client'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(task)
  } catch (err) {
    console.error('GET /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const updates: any = {}
    if (body.title !== undefined) updates.title = String(body.title)
    if (body.description !== undefined) updates.description = body.description
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.status !== undefined) updates.status = body.status
    if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null
    if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId || null
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags : []

    const updated = await prisma.task.update({ where: { id }, data: updates })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/tasks/[id] error', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
