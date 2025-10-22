import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return respond.forbidden('Forbidden')
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

    const tenantId = ctx.tenantId
    const total = await prisma.task.count({ where: tenantFilter(tenantId) })
    const completed = await prisma.task.count({ where: { ...(tenantFilter(tenantId) as any), status: 'DONE' as any } })

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

    const sample = await prisma.task.findMany({ select: { createdAt: true, updatedAt: true }, where: tenantFilter(tenantId), take: 1000 })
    const avgAgeDays = sample.length
      ? Math.round(sample.reduce((sum, t) => sum + ((t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / sample.length)
      : 0

    const complianceTotal = await prisma.task.count({ where: { ...(tenantFilter(tenantId) as any), complianceRequired: true } })
    const complianceCompleted = await prisma.complianceRecord.count({ where: { status: { equals: 'COMPLETED' } } })

    const completedRecords = await prisma.complianceRecord.findMany({ where: { status: 'COMPLETED', completedAt: { not: null } }, select: { completedAt: true, createdAt: true }, take: 1000 })
    const avgTimeToCompliance = completedRecords.length
      ? Math.round(completedRecords.reduce((sum, r) => sum + ((r.completedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / completedRecords.length)
      : 0

    const now = new Date()
    const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    const created = await prisma.task.findMany({ select: { createdAt: true }, where: { ...(tenantFilter(tenantId) as any), createdAt: { gte: start } } })
    const dones = await prisma.task.findMany({ select: { updatedAt: true }, where: { ...(tenantFilter(tenantId) as any), updatedAt: { gte: start }, status: 'DONE' as any } })
    const dayKey = (d: Date) => d.toISOString().slice(0, 10)
    const keys = Array.from({ length: 7 }).map((_, i) => dayKey(new Date(start.getTime() + i * 24 * 60 * 60 * 1000)))
    const totalsMap = Object.fromEntries(keys.map(k => [k, 0])) as Record<string, number>
    const completedMap = Object.fromEntries(keys.map(k => [k, 0])) as Record<string, number>
    created.forEach(c => { const k = dayKey(new Date(c.createdAt)); if (k in totalsMap) totalsMap[k] += 1 })
    dones.forEach(d => { const k = dayKey(new Date(d.updatedAt)); if (k in completedMap) completedMap[k] += 1 })
    const dailyTotals = keys.map(k => totalsMap[k] || 0)
    const dailyCompleted = keys.map(k => completedMap[k] || 0)

    return NextResponse.json({ total, completed, byStatus, byPriority, avgAgeDays, compliance: { complianceTotal, complianceCompleted, complianceRate: complianceTotal > 0 ? Math.round((complianceCompleted / complianceTotal) * 1000) / 10 : 0, overdueCompliance: await prisma.task.count({ where: { ...(tenantFilter(tenantId) as any), complianceRequired: true, complianceDeadline: { lt: now }, NOT: { complianceRecords: { some: { status: 'COMPLETED' } } } } }), avgTimeToCompliance }, dailyTotals, dailyCompleted })
  } catch (err) {
    console.error('GET /api/admin/tasks/analytics error', err)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
})
