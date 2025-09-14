import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function mapStatusToDb(s?: string): any {
  if (!s) return undefined
  const v = String(s || '').toUpperCase()
  if (v === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (v === 'DONE' || v === 'COMPLETED') return 'DONE'
  if (v === 'OPEN' || v === 'PENDING') return 'OPEN'
  return undefined
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { action, taskIds, updates } = body || {}
    if (!Array.isArray(taskIds) || taskIds.length === 0) return NextResponse.json({ error: 'Missing taskIds' }, { status: 400 })

    switch (action) {
      case 'delete':
        await prisma.task.deleteMany({ where: { id: { in: taskIds } } })
        return NextResponse.json({ ok: true })
      case 'update': {
        const data: any = { ...(updates || {}) }
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
