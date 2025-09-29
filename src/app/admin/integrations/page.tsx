"use client"
import { useEffect, useState } from 'react'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unavailable' | 'operational' }) {
  const cls = status === 'healthy' || status === 'operational'
    ? 'bg-green-100 text-green-800 border-green-200'
    : status === 'degraded'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-red-100 text-red-800 border-red-200'
  return <Badge className={cls}>{status}</Badge>
}

export default function AdminIntegrationsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch('/api/admin/system/health')
        if (!res.ok) throw new Error(`Health check failed (${res.status})`)
        const data = await res.json()
        if (mounted) setHealth(data)
      } catch (e) {
        if (mounted) setError('Unable to load system health')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 30000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Integrations.</div>}>
      <StandardPage title="Integrations" subtitle="View system integrations and tools">
        {error && (
          <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-800 rounded">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Live status of core services</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && <div className="text-sm text-gray-500">Checking…</div>}
              {health && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">Overall</div>
                    <StatusBadge status={health.summary?.overall || 'degraded'} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">Database</div>
                    <StatusBadge status={health.db?.status || 'degraded'} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">Email</div>
                    <StatusBadge status={health.email?.status || 'degraded'} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">Auth</div>
                    <StatusBadge status={health.auth?.status || 'degraded'} />
                  </div>
                  {Array.isArray(health.externalApis) && health.externalApis.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium text-gray-900 mb-2">External APIs</div>
                      <div className="space-y-2">
                        {health.externalApis.map((api: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">{api.name}</div>
                            <StatusBadge status={api.status || 'degraded'} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Inspect client-reported route timings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => { window.location.href = '/admin/perf-metrics' }}>Open Perf Metrics</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health History</CardTitle>
              <CardDescription>API health snapshots and errors</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => { window.location.href = '/admin/health-history' }}>Open Health History</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Center</CardTitle>
              <CardDescription>Download CSVs for audits, users, bookings, services</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => { window.location.href = '/admin/reports' }}>Open Reports</Button>
            </CardContent>
          </Card>
        </div>
      </StandardPage>
    </PermissionGate>
  )
}
