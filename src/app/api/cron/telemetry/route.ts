import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { captureErrorIfAvailable } from '@/lib/observability-helpers'

export const runtime = 'nodejs'

// GET /api/cron/telemetry
// Protected endpoint that returns recent telemetry for reminder runs.
// Auth: requires Authorization: Bearer <CRON_SECRET> (or NEXT_CRON_SECRET)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const cronSecret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET || ''
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = Number(new URL(req.url).searchParams.get('limit') || 20)

    // Fetch recent audit health logs that contain reminders:batch_summary
    const logs = await prisma.healthLog.findMany({
      where: { service: 'AUDIT', message: { contains: 'reminders:batch_summary' } },
      orderBy: { checkedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    })

    const runs: any[] = []
    let totalProcessed = 0
    let totalSent = 0
    let totalFailed = 0

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
          runSent += Number(tenantStats[t].sent || 0)
          runFailed += Number(tenantStats[t].failed || 0)
        }

        totalProcessed += processed
        totalSent += runSent
        totalFailed += runFailed

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
        // ignore parse errors but capture for observability
        await captureErrorIfAvailable(e, { route: 'cron:telemetry:parse', logId: l.id })
      }
    }

    const averageErrorRate = totalProcessed > 0 ? totalFailed / totalProcessed : 0

    // Aggregate per-tenant summaries across fetched runs
    const aggregatedTenants: Record<string, { processed: number; sent: number; failed: number }> = {}
    for (const run of runs) {
      const stats = run.tenantStats || {}
      for (const t in stats) {
        aggregatedTenants[t] = aggregatedTenants[t] || { processed: 0, sent: 0, failed: 0 }
        aggregatedTenants[t].processed += Number(stats[t].total || 0)
        aggregatedTenants[t].sent += Number(stats[t].sent || 0)
        aggregatedTenants[t].failed += Number(stats[t].failed || 0)
      }
    }

    return NextResponse.json({
      success: true,
      runs,
      summary: {
        runs: runs.length,
        totalProcessed,
        totalSent,
        totalFailed,
        averageErrorRate,
      },
      tenants: aggregatedTenants,
    })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'cron:telemetry' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
