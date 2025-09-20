import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export async function GET(request?: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasDb) {
      return NextResponse.json({
        total: 0,
        completed: 0,
        byStatus: [],
        byPriority: [],
        avgAgeDays: 0,
        compliance: {
          complianceTotal: 0,
          complianceCompleted: 0,
          complianceRate: 0,
          overdueCompliance: 0,
          avgTimeToCompliance: 0
        },
        dailyTotals: Array.from({ length: 7 }).map(() => 0),
        dailyCompleted: Array.from({ length: 7 }).map(() => 0),
      })
    }

    const tenantId = getTenantFromRequest(request as any)
    const total = await prisma.task.count({ where: tenantFilter(tenantId) })
    const completed = await prisma.task.count({ where: { ...tenantFilter(tenantId), status: 'DONE' as any } })

    const byStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: tenantFilter(tenantId)
    })

    const byPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: { _all: true },
      where: tenantFilter(tenantId)
    })

    // Approximate average cycle time (days) using createdAt -> updatedAt
    const sample = await prisma.task.findMany({ select: { createdAt: true, updatedAt: true }, where: tenantFilter(tenantId), take: 1000 })
    const avgAgeDays = sample.length
      ? Math.round(sample.reduce((sum, t) => sum + ((t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / sample.length)
      : 0

    // Compliance metrics
    const complianceTotal = await prisma.task.count({ where: { ...tenantFilter(tenantId), complianceRequired: true } })
    const complianceCompleted = await prisma.complianceRecord.count({ where: { status: { equals: 'COMPLETED' } } })

    // average time to compliance: average days between createdAt and complianceRecord.completedAt for completed records
    const completedRecords = await prisma.complianceRecord.findMany({ where: { status: 'COMPLETED', completedAt: { not: null } }, select: { completedAt: true, createdAt: true }, take: 1000 })
    const avgTimeToCompliance = completedRecords.length
      ? Math.round(completedRecords.reduce((sum, r) => sum + ((r.completedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / completedRecords.length)
      : 0

    // overdue compliance: tasks with complianceRequired true and complianceDeadline < now and no completed compliance record
    const now = new Date()
    const overdueCompliance = await prisma.task.count({ where: { ...tenantFilter(tenantId), complianceRequired: true, complianceDeadline: { lt: now }, NOT: { complianceRecords: { some: { status: 'COMPLETED' } } } } })

    const complianceRate = complianceTotal > 0 ? Math.round((complianceCompleted / complianceTotal) * 1000) / 10 : 0

    // Daily trends (last 7 days)
    const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    const created = await prisma.task.findMany({ select: { createdAt: true }, where: { ...tenantFilter(tenantId), createdAt: { gte: start } } })
    const dones = await prisma.task.findMany({ select: { updatedAt: true }, where: { ...tenantFilter(tenantId), updatedAt: { gte: start }, status: 'DONE' as any } })
    const dayKey = (d: Date) => d.toISOString().slice(0, 10)
    const keys = Array.from({ length: 7 }).map((_, i) => dayKey(new Date(start.getTime() + i * 24 * 60 * 60 * 1000)))
    const totalsMap = Object.fromEntries(keys.map(k => [k, 0])) as Record<string, number>
    const completedMap = Object.fromEntries(keys.map(k => [k, 0])) as Record<string, number>
    created.forEach(c => { const k = dayKey(new Date(c.createdAt)); if (k in totalsMap) totalsMap[k] += 1 })
    dones.forEach(d => { const k = dayKey(new Date(d.updatedAt)); if (k in completedMap) completedMap[k] += 1 })
    const dailyTotals = keys.map(k => totalsMap[k] || 0)
    const dailyCompleted = keys.map(k => completedMap[k] || 0)

    return NextResponse.json({ total, completed, byStatus, byPriority, avgAgeDays, compliance: { complianceTotal, complianceCompleted, complianceRate, overdueCompliance, avgTimeToCompliance }, dailyTotals, dailyCompleted })
  } catch (err) {
    console.error('GET /api/admin/tasks/analytics error', err)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}
