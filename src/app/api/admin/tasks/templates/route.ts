import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

// Fallback file paths (only used when DB is not configured)
const DATA_PATH = path.join(process.cwd(), 'src', 'app', 'admin', 'tasks', 'data', 'templates.json')
function readTemplates() {
  try { const raw = fs.readFileSync(DATA_PATH, 'utf-8'); return JSON.parse(raw) } catch { return [] }
}
function writeTemplates(tmpls: any[]) {
  try { fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true }); fs.writeFileSync(DATA_PATH, JSON.stringify(tmpls, null, 2), 'utf-8'); return true } catch (e) { console.error('Failed to write templates', e); return false }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    if (!hasDb) {
      const templates = readTemplates()
      return NextResponse.json(templates)
    }

    const rows = await prisma.taskTemplate.findMany({ orderBy: { createdAt: 'desc' } })
    const mapped = rows.map(t => ({
      id: t.id,
      name: t.name,
      content: t.content,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
    return NextResponse.json(mapped)
  } catch (e) {
    console.error('GET templates error', e)
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))

    if (!hasDb) {
      const templates = readTemplates()
      const now = new Date().toISOString()
      const id = 'tmpl_' + Math.random().toString(36).slice(2, 9)
      const t = {
        id,
        name: body.name || `Template ${templates.length+1}`,
        content: body.content || '',
        description: body.description || '',
        defaultPriority: body.defaultPriority || 'MEDIUM',
        defaultCategory: body.defaultCategory || 'system',
        estimatedHours: typeof body.estimatedHours === 'number' ? body.estimatedHours : 1,
        checklistItems: Array.isArray(body.checklistItems) ? body.checklistItems : [],
        category: body.category || null,
        requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : [],
        defaultAssigneeRole: body.defaultAssigneeRole || null,
        createdAt: now,
        updatedAt: now,
      }
      templates.unshift(t)
      writeTemplates(templates)
      return NextResponse.json(t, { status: 201 })
    }

    const created = await prisma.taskTemplate.create({
      data: {
        name: String(body.name || 'Template'),
        content: String(body.content || ''),
        createdById: session.user.id as string | undefined,
      } as any
    })
    const mapped = { id: created.id, name: created.name, content: created.content, createdAt: created.createdAt.toISOString(), updatedAt: created.updatedAt.toISOString() }
    return NextResponse.json(mapped, { status: 201 })
  } catch (e) {
    console.error('Create template error', e)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))

    if (!hasDb) {
      const templates = readTemplates()
      const idx = templates.findIndex((t: any) => t.id === body.id)
      if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      templates[idx] = { ...templates[idx], ...body, updatedAt: new Date().toISOString() }
      writeTemplates(templates)
      return NextResponse.json(templates[idx])
    }

    if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const updated = await prisma.taskTemplate.update({ where: { id: String(body.id) }, data: { name: body.name, content: body.content } })
    const mapped = { id: updated.id, name: updated.name, content: updated.content, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() }
    return NextResponse.json(mapped)
  } catch (e) {
    console.error('Update template error', e)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (!hasDb) {
      const templates = readTemplates()
      const remaining = templates.filter((t: any) => t.id !== id)
      writeTemplates(remaining)
      return NextResponse.json({ ok: true })
    }

    await prisma.taskTemplate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Delete template error', e)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
