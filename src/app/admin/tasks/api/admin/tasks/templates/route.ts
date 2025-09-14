import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'temp', 'task management', 'data', 'templates.json')

function readTemplates() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

function writeTemplates(tmpls: any[]) {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
    fs.writeFileSync(DATA_PATH, JSON.stringify(tmpls, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('Failed to write templates', e)
    return false
  }
}

export async function GET() {
  const templates = readTemplates()
  return NextResponse.json(templates)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const templates = readTemplates()
    const now = new Date().toISOString()
    const id = 'tmpl_' + Math.random().toString(36).slice(2, 9)
    const t = { id, name: body.name || `Template ${templates.length+1}`, content: body.content || '', createdAt: now, updatedAt: now }
    templates.unshift(t)
    writeTemplates(templates)
    return NextResponse.json(t, { status: 201 })
  } catch (e) {
    console.error('Create template error', e)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const templates = readTemplates()
    const idx = templates.findIndex((t: any) => t.id === body.id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    templates[idx] = { ...templates[idx], ...body, updatedAt: new Date().toISOString() }
    writeTemplates(templates)
    return NextResponse.json(templates[idx])
  } catch (e) {
    console.error('Update template error', e)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const templates = readTemplates()
    const remaining = templates.filter((t: any) => t.id !== id)
    writeTemplates(remaining)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Delete template error', e)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
