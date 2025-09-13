import { NextResponse } from 'next/server'
import { prisma } from '../../../../../prisma/client'

function toCSV(rows: any[], headers: string[]) {
  const esc = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'string' ? v : String(v)
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }
  const head = headers.join(',')
  const body = rows.map(r => headers.map(h => esc(r[h])).join(',')).join('\n')
  return head + '\n' + body
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const format = (url.searchParams.get('format') || 'csv').toLowerCase()

    // Basic filters (optional)
    const status = url.searchParams.getAll('status')
    const priority = url.searchParams.getAll('priority')

    const where: any = {}
    if (status.length) where.status = { in: status.map(s => s.toUpperCase()) }
    if (priority.length) where.priority = { in: priority.map(p => p.toUpperCase()) }

    const tasks = await prisma.task.findMany({
      where,
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const rows = tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      priority: t.priority,
      status: t.status,
      assignee: t.assignee?.name || t.assignee?.email || '',
      dueAt: t.dueAt ? t.dueAt.toISOString() : '',
      tags: (t.tags || []).join('|'),
      createdAt: t.createdAt.toISOString(),
    }))

    const headers = ['id','title','description','priority','status','assignee','dueAt','tags','createdAt']
    const csv = toCSV(rows, headers)

    const filename = `tasks-export-${new Date().toISOString().slice(0,10)}.${format === 'xlsx' ? 'xlsx' : 'csv'}`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Export error', err)
    return new NextResponse(JSON.stringify({ error: 'Failed to export tasks' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
