import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function makeId() {
  return 'c_' + Math.random().toString(36).slice(2, 9)
}

export async function GET(request: Request, context: any) {
  const params = context?.params || context
  try {
    const { id } = params
    const task = await prisma.task.findUnique({ where: { id }, select: { comments: true } })
    const comments = task?.comments ?? []
    return NextResponse.json(Array.isArray(comments) ? comments : [])
  } catch (err) {
    console.error('GET comments error', err)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json().catch(() => null)
    if (!body || !body.content) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const now = new Date().toISOString()
    const comment = {
      id: makeId(),
      authorId: body.authorId || null,
      authorName: body.authorName || 'Anonymous',
      content: String(body.content),
      parentId: body.parentId || null,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      createdAt: now,
      updatedAt: now,
    }

    // Read existing comments and append
    const task = await prisma.task.findUnique({ where: { id }, select: { comments: true } })
    const comments = Array.isArray(task?.comments) ? task!.comments as any[] : []
    comments.push(comment)

    await prisma.task.update({ where: { id }, data: { comments } })

    // Broadcast event
    try {
      const { broadcast } = await import('@/lib/realtime')
      broadcast({ type: 'task.comment.created', payload: { taskId: id, comment } })
    } catch (e) { /* best-effort */ }

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('POST comments error', err)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
