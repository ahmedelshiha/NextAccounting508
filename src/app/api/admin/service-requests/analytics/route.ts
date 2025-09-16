import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [total, byStatus, byPriority, newThisWeek, completedThisMonth, pipeline] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.serviceRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.serviceRequest.groupBy({ by: ['priority'], _count: { _all: true } }),
    prisma.serviceRequest.count({ where: { createdAt: { gte: new Date(Date.now() - 7*24*60*60*1000) } } }),
    prisma.serviceRequest.count({ where: { status: 'COMPLETED' as any, updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.serviceRequest.aggregate({ _sum: { budgetMax: true }, where: { status: { in: ['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS'] as any } } })
  ])

  const statusDistribution = byStatus.reduce((acc: Record<string, number>, s) => { acc[s.status as any] = s._count._all; return acc }, {})
  const priorityDistribution = byPriority.reduce((acc: Record<string, number>, s) => { acc[s.priority as any] = s._count._all; return acc }, {})

  return NextResponse.json({
    success: true,
    data: {
      total,
      newThisWeek,
      completedThisMonth,
      pipelineValue: pipeline._sum.budgetMax ?? 0,
      statusDistribution,
      priorityDistribution,
      activeRequests: (statusDistribution['ASSIGNED'] ?? 0) + (statusDistribution['IN_PROGRESS'] ?? 0),
      completionRate: total ? Math.round(((statusDistribution['COMPLETED'] ?? 0) / total) * 100) : 0,
    }
  })
}
