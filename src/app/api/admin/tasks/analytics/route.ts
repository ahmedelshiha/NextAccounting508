import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const total = await prisma.task.count()
    const byStatus = await prisma.task.groupBy({ by: ['status'], _count: { _all: true } })
    const byPriority = await prisma.task.groupBy({ by: ['priority'], _count: { _all: true } })
    const completed = await prisma.task.count({ where: { status: 'COMPLETED' } })
    const avgCompletion = await prisma.task.aggregate({ _avg: { completionPercentage: true } })

    return NextResponse.json({ total, completed, byStatus, byPriority, avgCompletion })
  } catch (err) {
    console.error('GET /api/admin/tasks/analytics error', err)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}
