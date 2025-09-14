import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const total = await prisma.task.count()
    const completed = await prisma.task.count({ where: { status: 'DONE' as any } })

    const byStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
    })

    const byPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: { _all: true },
    })

    // Approximate average cycle time (days) using createdAt -> updatedAt
    const sample = await prisma.task.findMany({ select: { createdAt: true, updatedAt: true }, take: 1000 })
    const avgAgeDays = sample.length
      ? Math.round(sample.reduce((sum, t) => sum + ((t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / sample.length)
      : 0

    return NextResponse.json({ total, completed, byStatus, byPriority, avgAgeDays })
  } catch (err) {
    console.error('GET /api/admin/tasks/analytics error', err)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}
