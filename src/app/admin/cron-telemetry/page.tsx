import React from 'react'
import prisma from '@/lib/prisma'
import { formatISO } from 'date-fns'

// Server component to display recent cron reminder telemetry for admins.
// This component queries the healthLog audit entries directly (best-effort) and
// renders a compact dashboard with recent run summaries and aggregated tenant stats.
export default async function Page({ searchParams }: { searchParams?: { limit?: string } }) {
  const limit = Number(searchParams?.limit || '20')
  // Read recent audit health logs that contain reminders:batch_summary
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
      // ignore parsing error for this log entry
      runs.push({ id: l.id, at: l.checkedAt, processed: 0, sent: 0, failed: 0, durationMs: 0, effectiveGlobal: 0, effectiveTenant: 0, errorRate: 0, tenantStats: {} })
    }
  }

  // Compute overall aggregates for display
  let totalProcessed = 0
  let totalSent = 0
  let totalFailed = 0
  for (const r of runs) {
    totalProcessed += Number(r.processed || 0)
    totalSent += Number(r.sent || 0)
    totalFailed += Number(r.failed || 0)
  }
  const averageErrorRate = totalProcessed > 0 ? (totalFailed / totalProcessed) : 0

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cron Reminders Telemetry</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-white shadow">
          <div className="text-sm text-gray-500">Runs fetched</div>
          <div className="text-xl font-semibold">{runs.length}</div>
        </div>
        <div className="p-4 rounded-lg bg-white shadow">
          <div className="text-sm text-gray-500">Total processed</div>
          <div className="text-xl font-semibold">{totalProcessed}</div>
        </div>
        <div className="p-4 rounded-lg bg-white shadow">
          <div className="text-sm text-gray-500">Average error rate</div>
          <div className="text-xl font-semibold">{(averageErrorRate * 100).toFixed(2)}%</div>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-2">Recent Runs</h2>
        <div className="overflow-auto rounded-lg border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Run ID</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Processed</th>
                <th className="px-4 py-2">Sent</th>
                <th className="px-4 py-2">Failed</th>
                <th className="px-4 py-2">Duration (ms)</th>
                <th className="px-4 py-2">Global</th>
                <th className="px-4 py-2">Tenant</th>
                <th className="px-4 py-2">Err %</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{String(r.id).slice(0,8)}</td>
                  <td className="px-4 py-2">{r.at ? formatISO(new Date(r.at)) : '-'}</td>
                  <td className="px-4 py-2">{r.processed}</td>
                  <td className="px-4 py-2">{r.sent}</td>
                  <td className="px-4 py-2">{r.failed}</td>
                  <td className="px-4 py-2">{r.durationMs}</td>
                  <td className="px-4 py-2">{r.effectiveGlobal}</td>
                  <td className="px-4 py-2">{r.effectiveTenant}</td>
                  <td className="px-4 py-2">{(Number(r.errorRate || 0) * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-2">Per-tenant Summary (aggregated)</h2>
        <div className="overflow-auto rounded-lg border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Tenant</th>
                <th className="px-4 py-2">Processed</th>
                <th className="px-4 py-2">Sent</th>
                <th className="px-4 py-2">Failed</th>
                <th className="px-4 py-2">Error %</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(aggregatedTenants).map(([t, s]) => (
                <tr key={t} className="border-t">
                  <td className="px-4 py-2 break-words w-48">{t}</td>
                  <td className="px-4 py-2">{s.processed}</td>
                  <td className="px-4 py-2">{s.sent}</td>
                  <td className="px-4 py-2">{s.failed}</td>
                  <td className="px-4 py-2">{s.processed > 0 ? ((s.failed / s.processed) * 100).toFixed(2) + '%' : '0.00%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-xs text-gray-500">Tip: tune REMINDERS_GLOBAL_CONCURRENCY, REMINDERS_TENANT_CONCURRENCY, and REMINDERS_BACKOFF_THRESHOLD in your envs based on these metrics.</div>
    </div>
  )
}
