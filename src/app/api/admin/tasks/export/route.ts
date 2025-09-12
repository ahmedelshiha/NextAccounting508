import { getServerSession } from 'next-auth/next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes((session.user as any)?.role ?? '')) {
      return new Response('Unauthorized', { status: 401 })
    }

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    const format = (url.searchParams.get('format') || 'csv').toLowerCase()

    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)

    let rows: any[] = []
    if (!hasDb) {
      rows = [
        { id: 't1', title: 'Send monthly newsletters', dueAt: null, priority: 'HIGH', status: 'OPEN' },
        { id: 't2', title: 'Review pending bookings', dueAt: null, priority: 'MEDIUM', status: 'OPEN' },
      ]
    } else {
      rows = await prisma.task.findMany({ where, orderBy: { createdAt: 'desc' }, take: 1000 })
    }

    if (format === 'csv') {
      const header = ['id','title','description','priority','status','dueAt','assigneeId','createdAt','updatedAt']
      const csvRows = [header.join(',')]
      for (const r of rows) {
        const vals = header.map((k) => {
          const v = (r as any)[k] ?? ''
          const s = String(v).replace(/"/g, '""')
          return `"${s}"`
        })
        csvRows.push(vals.join(','))
      }
      const csv = csvRows.join('\n')
      return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="tasks_export_${Date.now()}.csv"` } })
    }

    return NextResponse.json({ tasks: rows })
  } catch (err) {
    console.error('export error', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
