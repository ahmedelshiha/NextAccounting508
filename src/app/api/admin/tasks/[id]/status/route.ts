import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json().catch(() => ({}))
    const status = body.status
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    const updated = await prisma.task.update({ where: { id }, data: { status } })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/admin/tasks/[id]/status error', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
