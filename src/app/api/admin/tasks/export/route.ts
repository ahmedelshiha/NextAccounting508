import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return new Response('Unauthorized', { status: 401 })
    }

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    const format = (url.searchParams.get('format') || 'csv').toLowerCase()

    const where: Prisma.TaskWhereInput | undefined = q
      ? {
          OR: [
            { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : undefined

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)

    type TaskRow = {
      id: string
      title: string
      description?: string | null
      priority: string
      status: string
      dueAt: Date | null
      assigneeId: string | null
      createdAt: Date
      updatedAt: Date
    }

    let rows: TaskRow[] = []
    if (!hasDb) {
      rows = [
        { id: 't1', title: 'Send monthly newsletters', description: '', dueAt: null, priority: 'HIGH', status: 'OPEN', assigneeId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 't2', title: 'Review pending bookings', description: '', dueAt: null, priority: 'MEDIUM', status: 'OPEN', assigneeId: null, createdAt: new Date(), updatedAt: new Date() },
      ]
    } else {
      const dbRows = await prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 1000,
        select: { id: true, title: true, priority: true, status: true, dueAt: true, assigneeId: true, createdAt: true, updatedAt: true },
      })
      rows = dbRows.map((r) => ({ ...r, description: '' })) as TaskRow[]
    }

    if (format === 'csv') {
      const header: (keyof TaskRow)[] = ['id','title','description','priority','status','dueAt','assigneeId','createdAt','updatedAt']
      const csvRows = [header.join(',')]
      for (const r of rows) {
        const vals = header.map((k) => {
          const v = r[k] ?? ''
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
