import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function mapStatusToDb(s: string): any {
  const v = String(s || '').toUpperCase()
  if (v === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (v === 'DONE' || v === 'COMPLETED') return 'DONE'
  // default/open
  if (v === 'OPEN' || v === 'PENDING') return 'OPEN'
  return 'OPEN'
}

export async function PATCH(request: Request, context: any) {
  const params = context?.params || context
  try {
    const { id } = params
    const body = await request.json().catch(() => ({}))
    const status = mapStatusToDb(body.status)
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    const updated = await prisma.task.update({ where: { id }, data: { status } })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/admin/tasks/[id]/status error', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
