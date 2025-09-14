import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const total = await prisma.task.count()
    const completed = await prisma.task.count({ where: { status: 'COMPLETED' as any } })
    const byStatus: any = await prisma.$queryRaw`SELECT status, COUNT(*) as _count FROM "Task" GROUP BY status`
    const byPriority: any = await prisma.$queryRaw`SELECT priority, COUNT(*) as _count FROM "Task" GROUP BY priority`
    const avgCompletion: any = await prisma.$queryRaw`SELECT AVG("completionPercentage") as avg FROM "Task"`

    return NextResponse.json({ total, completed, byStatus, byPriority, avgCompletion })
  } catch (err) {
    console.error('GET /api/admin/tasks/analytics error', err)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}
