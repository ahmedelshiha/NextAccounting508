import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function commentsPath(taskId: string) {
  return path.join(process.cwd(), 'src', 'app', 'admin', 'tasks', 'data', 'comments', `${taskId}.json`)
}

function ensureDir(p: string) {
  try { fs.mkdirSync(p, { recursive: true }) } catch (e) { /* ignore */ }
}

function readComments(taskId: string) {
  const file = commentsPath(taskId)
  try {
    const raw = fs.readFileSync(file, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function writeComments(taskId: string, comments: any[]) {
  const file = commentsPath(taskId)
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, JSON.stringify(comments, null, 2), 'utf-8')
}

function makeId() {
  return 'c_' + Math.random().toString(36).slice(2, 9)
}

export async function GET(_request: Request, context: any) {
  const params = context?.params || context
  const { id } = params
  try {
    const comments = readComments(id)
    return NextResponse.json(comments)
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

    try {
      const { broadcast } = await import('@/lib/realtime')
      broadcast({ type: 'task.comment.created', payload: { taskId: id, comment } })
    } catch { /* best-effort */ }

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('POST comments error', err)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
