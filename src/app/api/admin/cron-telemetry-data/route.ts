import { NextResponse, NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { formatISO } from 'date-fns'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = 20
    const logs = await prisma.healthLog.findMany({
      where: { service: 'AUDIT', message: { contains: 'reminders:batch_summary' } },
      orderBy: { checkedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    })

    const runs: any[] = []
    const aggregatedTenants: Record<string, { processed: number; sent: number; failed: number }> = {}

    for (const l of logs) {
      try {
        const parsed = JSON.parse(String(l.message))
        const details = parsed.details || {}
        const processed = Number(details.processed || 0)
        const durationMs = Number(details.durationMs || 0)
        const effectiveGlobal = Number(details.effectiveGlobal || 0)
        const effectiveTenant = Number(details.effectiveTenant || 0)
        const errorRate = Number(details.errorRate || 0)
        const tenantStats = details.tenantStats || {}

        let runSent = 0
        let runFailed = 0
        for (const t in tenantStats) {
          const s = tenantStats[t]
          runSent += Number(s.sent || 0)
          runFailed += Number(s.failed || 0)

          aggregatedTenants[t] = aggregatedTenants[t] || { processed: 0, sent: 0, failed: 0 }
          aggregatedTenants[t].processed += Number(s.total || 0)
          aggregatedTenants[t].sent += Number(s.sent || 0)
          aggregatedTenants[t].failed += Number(s.failed || 0)
        }

        runs.push({
          id: l.id,
          at: l.checkedAt,
          processed,
          sent: runSent,
          failed: runFailed,
          durationMs,
          effectiveGlobal,
          effectiveTenant,
          errorRate,
          tenantStats,
        })
      } catch (e) {
        runs.push({
          id: l.id,
          at: l.checkedAt,
          processed: 0,
          sent: 0,
          failed: 0,
          durationMs: 0,
          effectiveGlobal: 0,
          effectiveTenant: 0,
          errorRate: 0,
          tenantStats: {},
        })
      }
    }

    return NextResponse.json({
      runs,
      aggregatedTenants,
    })
  } catch (e) {
    console.error('Failed to get cron telemetry data:', e)
    return NextResponse.json({ error: 'Failed to load telemetry data' }, { status: 500 })
  }
})
