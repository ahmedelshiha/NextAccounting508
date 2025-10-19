import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { formatISO } from 'date-fns'
import SettingsShell, { SettingsSection, SettingsCard } from '@/components/admin/settings/SettingsShell'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import { AlertCircle, Activity } from 'lucide-react'

export default async function Page({ searchParams }: { searchParams?: { limit?: string } }) {
  const limit = Number(searchParams?.limit || '20')
  
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
      </div>
    )
  }

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
      runs.push({ id: l.id, at: l.checkedAt, processed: 0, sent: 0, failed: 0, durationMs: 0, effectiveGlobal: 0, effectiveTenant: 0, errorRate: 0, tenantStats: {} })
    }
  }

  let totalProcessed = 0
  let totalSent = 0
  let totalFailed = 0
  for (const r of runs) {
    totalProcessed += Number(r.processed || 0)
    totalSent += Number(r.sent || 0)
    totalFailed += Number(r.failed || 0)
  }
  const averageErrorRate = totalProcessed > 0 ? (totalFailed / totalProcessed) : 0

  const recentRunsDescription = `Last ${limit} cron reminder job executions with detailed metrics`

  return (
    <SettingsShell
      title="Cron Reminders Telemetry"
      description="Monitor recent cron reminder runs, delivery rates, and per-tenant performance metrics"
      icon={Activity}
      showBackButton={true}
      actions={
        <div className="flex items-center gap-2">
          <FavoriteToggle 
            settingKey="cronTelemetry" 
            route="/admin/settings/cron-telemetry" 
            label="Cron Telemetry" 
          />
        </div>
      }
    >
      <div className="space-y-6">
        <SettingsSection 
          title="Summary Metrics" 
          description="Overview of recent cron reminder job executions"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SettingsCard>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                <p className="text-3xl font-bold">{runs.length}</p>
              </div>
            </SettingsCard>

            <SettingsCard>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Messages Processed</p>
                <p className="text-3xl font-bold">{totalProcessed.toLocaleString()}</p>
              </div>
            </SettingsCard>

            <SettingsCard>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Average Error Rate</p>
                <p className={`text-3xl font-bold ${averageErrorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                  {(averageErrorRate * 100).toFixed(2)}%
                </p>
              </div>
            </SettingsCard>
          </div>
        </SettingsSection>

        <SettingsSection 
          title="Recent Runs" 
          description={recentRunsDescription}
        >
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Run ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Processed</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sent</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Failed</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Duration (ms)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Error %</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length > 0 ? (
                    runs.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{String(r.id).slice(0, 8)}</td>
                        <td className="px-4 py-3 text-sm">{r.at ? formatISO(new Date(r.at)) : '-'}</td>
                        <td className="px-4 py-3 text-right">{r.processed}</td>
                        <td className="px-4 py-3 text-right">{r.sent}</td>
                        <td className="px-4 py-3 text-right">{r.failed}</td>
                        <td className="px-4 py-3 text-right">{r.durationMs}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={r.errorRate > 0.05 ? 'text-red-600 font-medium' : ''}>
                            {(Number(r.errorRate || 0) * 100).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No cron reminder runs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection 
          title="Per-Tenant Summary" 
          description="Aggregated statistics for each tenant across all runs"
        >
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tenant ID</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Processed</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sent</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Failed</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Error %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(aggregatedTenants).length > 0 ? (
                    Object.entries(aggregatedTenants).map(([t, s]) => (
                      <tr key={t} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs break-all">{t}</td>
                        <td className="px-4 py-3 text-right">{s.processed}</td>
                        <td className="px-4 py-3 text-right">{s.sent}</td>
                        <td className="px-4 py-3 text-right">{s.failed}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={s.processed > 0 && (s.failed / s.processed) > 0.05 ? 'text-red-600 font-medium' : ''}>
                            {s.processed > 0 ? ((s.failed / s.processed) * 100).toFixed(2) : '0.00'}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No tenant data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SettingsSection>

        <SettingsCard className="bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">Performance Tuning Tips</p>
              <p className="text-sm text-blue-800">Adjust these environment variables based on the metrics above:</p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li><code className="bg-blue-100 px-2 py-1 rounded text-xs">REMINDERS_GLOBAL_CONCURRENCY</code> - Control parallel job execution</li>
                <li><code className="bg-blue-100 px-2 py-1 rounded text-xs">REMINDERS_TENANT_CONCURRENCY</code> - Limit tenant-level concurrency</li>
                <li><code className="bg-blue-100 px-2 py-1 rounded text-xs">REMINDERS_BACKOFF_THRESHOLD</code> - Set backoff strategy for retries</li>
              </ul>
            </div>
          </div>
        </SettingsCard>
      </div>
    </SettingsShell>
  )
}
