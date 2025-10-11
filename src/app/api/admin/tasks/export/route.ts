import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

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

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.ANALYTICS_EXPORT)) {
      return respond.forbidden('Forbidden')
    }

    const url = new URL(request.url)
    const format = (url.searchParams.get('format') || 'csv').toLowerCase()

    const status = url.searchParams.getAll('status')
    const priority = url.searchParams.getAll('priority')

    const tenantId = ctx.tenantId

    const where: any = { ...(tenantFilter(tenantId) as any) }
    if (status.length) where.status = { in: status.map(s => s.toUpperCase()) }
    if (priority.length) where.priority = { in: priority.map(p => p.toUpperCase()) }

    const tasks = await prisma.task.findMany({
      where,
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }) as any[]

    const rows = tasks.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      assignee: t.assignee?.name || t.assignee?.email || '',
      dueAt: t.dueAt ? t.dueAt.toISOString() : '',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))

    const headers = ['id','title','priority','status','assignee','dueAt','createdAt','updatedAt']
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
})
