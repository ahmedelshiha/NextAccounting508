import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request, context: any) {
  const params = context?.params || context
  try {
    const { id } = params
    const body = await request.json().catch(() => ({}))
    const assigneeId = body.assigneeId ?? null
    const updated = await prisma.task.update({ where: { id }, data: { assigneeId } })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('POST /api/admin/tasks/[id]/assign error', err)
    return NextResponse.json({ error: 'Failed to assign' }, { status: 500 })
  }
}
