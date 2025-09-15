import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

// Fallback file helpers (used only when DB is not configured)
function commentsPath(taskId: string) {
  return path.join(process.cwd(), 'src', 'app', 'admin', 'tasks', 'data', 'comments', `${taskId}.json`)
}
function ensureDir(p: string) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }
function readComments(taskId: string) {
  const file = commentsPath(taskId)
  try { const raw = fs.readFileSync(file, 'utf-8'); const data = JSON.parse(raw); return Array.isArray(data) ? data : [] } catch { return [] }
}
function writeComments(taskId: string, comments: any[]) {
  const file = commentsPath(taskId)
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, JSON.stringify(comments, null, 2), 'utf-8')
}
function makeId() { return 'c_' + Math.random().toString(36).slice(2, 9) }

export async function GET(_request: Request, context: any) {
  const params = context?.params || context
  const { id } = params
  try {
    if (!hasDb) {
      const comments = readComments(id)
      return NextResponse.json(comments)
    }

    const rows = await prisma.taskComment.findMany({
      where: { taskId: id },
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    })
    const mapped = rows.map(r => ({
      id: r.id,
      authorId: r.authorId,
      authorName: r.author?.name || r.author?.email || 'Anonymous',
      content: r.content,
      parentId: r.parentId,
      attachments: r.attachments || [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
    return NextResponse.json(mapped)
  } catch (err) {
    console.error('GET comments error', err)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(request: Request, context: any) {
  const params = context?.params || context
  const { id } = params
  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.content) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    if (!hasDb) {
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
      const comments = readComments(id)
      comments.push(comment)
      writeComments(id, comments)
      try { const { broadcast } = await import('@/lib/realtime'); broadcast({ type: 'task.comment.created', payload: { taskId: id, comment } }) } catch {}
      return NextResponse.json(comment, { status: 201 })
    }

    const session = await getServerSession(authOptions)
    const authorId = session?.user?.id || null

    const created = await prisma.taskComment.create({
      data: {
        taskId: id,
        authorId,
        content: String(body.content),
        parentId: body.parentId || null,
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
      } as any,
      include: { author: { select: { name: true, email: true } } }
    })

    const result = {
      id: created.id,
      authorId: created.authorId,
      authorName: created.author?.name || created.author?.email || 'Anonymous',
      content: created.content,
      parentId: created.parentId,
      attachments: created.attachments || [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }

    try { const { broadcast } = await import('@/lib/realtime'); broadcast({ type: 'task.comment.created', payload: { taskId: id, comment: result } }) } catch {}
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('POST comments error', err)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
