import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

function mapStatusToDb(s?: string): any {
  if (!s) return undefined
  const v = String(s || '').toUpperCase()
  if (v === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (v === 'DONE' || v === 'COMPLETED') return 'DONE'
  if (v === 'OPEN' || v === 'PENDING') return 'OPEN'
  return undefined
}

const BulkSchema = z.object({
  action: z.enum(['delete','update','assign']),
  taskIds: z.array(z.string()).min(1),
  updates: z.object({ status: z.string().optional(), assigneeId: z.string().nullable().optional() }).optional()
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json().catch(() => ({}))
    const parsed = BulkSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    const { action, taskIds, updates } = parsed.data

    switch (action) {
      case 'delete':
        await prisma.task.deleteMany({ where: { id: { in: taskIds } } })
        return NextResponse.json({ ok: true })
      case 'update': {
        const data: any = {}
        if (updates?.status) data.status = mapStatusToDb(updates.status)
        await prisma.task.updateMany({ where: { id: { in: taskIds } }, data })
        return NextResponse.json({ ok: true })
      }
      case 'assign':
        await prisma.task.updateMany({ where: { id: { in: taskIds } }, data: { assigneeId: updates?.assigneeId ?? null } })
        return NextResponse.json({ ok: true })
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err) {
    console.error('POST /api/admin/tasks/bulk error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
