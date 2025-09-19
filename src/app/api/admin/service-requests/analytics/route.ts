import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const runtime = 'nodejs'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(request as any)
  const where = tenantFilter(tenantId) as any

  try {
    const [total, byStatus, byPriority, newThisWeek, completedThisMonth, pipeline] = await Promise.all([
      prisma.serviceRequest.count({ where }),
      prisma.serviceRequest.groupBy({ by: ['status'], _count: { _all: true }, where }),
      prisma.serviceRequest.groupBy({ by: ['priority'], _count: { _all: true }, where }),
      prisma.serviceRequest.count({ where: { ...where, createdAt: { gte: new Date(Date.now() - 7*24*60*60*1000) } } }),
      prisma.serviceRequest.count({ where: { ...where, status: 'COMPLETED' as any, updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.serviceRequest.aggregate({ _sum: { budgetMax: true }, where: { ...where, status: { in: ['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS'] as any } } })
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
  } catch (e: any) {
    // Fallback for environments without DB or Prisma errors
    try {
      const { getAllRequests } = await import('@/lib/dev-fallbacks')
      const list = getAllRequests()
      const total = list.length
      const statusDistribution = list.reduce((acc: Record<string, number>, r: any) => { acc[r.status || 'SUBMITTED'] = (acc[r.status || 'SUBMITTED'] || 0) + 1; return acc }, {})
      const priorityDistribution = list.reduce((acc: Record<string, number>, r: any) => { acc[r.priority || 'MEDIUM'] = (acc[r.priority || 'MEDIUM'] || 0) + 1; return acc }, {})
      const now = Date.now()
      const newThisWeek = list.filter((r: any) => r.createdAt && (now - new Date(r.createdAt).getTime()) <= 7*24*60*60*1000).length
      const completedThisMonth = list.filter((r: any) => r.status === 'COMPLETED').length
      const pipelineValue = 0
      return NextResponse.json({ success: true, data: {
        total,
        newThisWeek,
        completedThisMonth,
        pipelineValue,
        statusDistribution,
        priorityDistribution,
        activeRequests: (statusDistribution['ASSIGNED'] ?? 0) + (statusDistribution['IN_PROGRESS'] ?? 0),
        completionRate: total ? Math.round(((statusDistribution['COMPLETED'] ?? 0) / total) * 100) : 0,
      } })
    } catch {
      return NextResponse.json({ success: true, data: {
        total: 0,
        newThisWeek: 0,
        completedThisMonth: 0,
        pipelineValue: 0,
        statusDistribution: {},
        priorityDistribution: {},
        activeRequests: 0,
        completionRate: 0,
      } })
    }
  }
}
