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

    // Compliance metrics
    const complianceTotal = await prisma.task.count({ where: { complianceRequired: true } })
    const complianceCompleted = await prisma.complianceRecord.count({ where: { status: { equals: 'COMPLETED' } } })

    // average time to compliance: average days between createdAt and complianceRecord.completedAt for completed records
    const completedRecords = await prisma.complianceRecord.findMany({ where: { status: 'COMPLETED', completedAt: { not: null } }, select: { completedAt: true, createdAt: true }, take: 1000 })
    const avgTimeToCompliance = completedRecords.length
      ? Math.round(completedRecords.reduce((sum, r) => sum + ((r.completedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / completedRecords.length)
      : 0

    // overdue compliance: tasks with complianceRequired true and complianceDeadline < now and no completed compliance record
    const now = new Date()
    const overdueCompliance = await prisma.task.count({ where: { complianceRequired: true, complianceDeadline: { lt: now }, NOT: { complianceRecords: { some: { status: 'COMPLETED' } } } } })

    const complianceRate = complianceTotal > 0 ? Math.round((complianceCompleted / complianceTotal) * 1000) / 10 : 0

    return NextResponse.json({ total, completed, byStatus, byPriority, avgAgeDays, compliance: { complianceTotal, complianceCompleted, complianceRate, overdueCompliance, avgTimeToCompliance } })
  } catch (err) {
    console.error('GET /api/admin/tasks/analytics error', err)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}
