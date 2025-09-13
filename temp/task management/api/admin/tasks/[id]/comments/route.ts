import { NextResponse } from 'next/server'
import { prisma } from '../../../../../prisma/client'

// GET comments, POST add comment
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const task = await prisma.task.findUnique({ where: { id }, select: { comments: true } })
    return NextResponse.json({ comments: task?.comments || [] })
  } catch (err) {
    console.error('GET /api/admin/tasks/[id]/comments error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json().catch(() => ({}))
    const comment = body.comment ? { id: String(Date.now()), text: String(body.comment), createdAt: new Date().toISOString() } : null
    if (!comment) return NextResponse.json({ error: 'Missing comment' }, { status: 400 })
    const task = await prisma.task.findUnique({ where: { id }, select: { comments: true } })
    const existing = Array.isArray(task?.comments) ? task!.comments : []
    const updated = await prisma.task.update({ where: { id }, data: { comments: [...existing, comment] } })
    return NextResponse.json({ comments: updated.comments })
  } catch (err) {
    console.error('POST /api/admin/tasks/[id]/comments error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
