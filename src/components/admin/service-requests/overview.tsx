"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import RequestStatusDistribution from './request-status-distribution'
import TeamWorkloadChart from './team-workload-chart'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'

interface AnalyticsResponse {
  success?: boolean
  data?: {
    total: number
    newThisWeek: number
    completedThisMonth: number
    pipelineValue: number
    statusDistribution: Record<string, number>
    priorityDistribution: Record<string, number>
    activeRequests: number
    completionRate: number
    appointmentsCount?: number
    bookingTypeDistribution?: Record<string, number>
  }
}

export default function ServiceRequestsOverview() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const perms = usePermissions()

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await apiFetch('/api/admin/service-requests/analytics')
        const j = await r.json().catch(() => ({})) as AnalyticsResponse
        if (!ignore) setAnalytics(j?.data ?? null)
      } finally { if (!ignore) setLoading(false) }
    })()
    return () => { ignore = true }
  }, [])

  const exportCsv = async () => {
    const res = await apiFetch('/api/admin/service-requests/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `service-requests-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Service Requests</h2>
          <p className="text-gray-600">Overview and management</p>
        </div>
        {perms.has(PERMISSIONS.ANALYTICS_EXPORT) && (
          <Button variant="outline" onClick={exportCsv} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total ?? (loading ? '—' : 0)}</div>
            <CardDescription>All time</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeRequests ?? (loading ? '—' : 0)}</div>
            <CardDescription>Assigned or in progress</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.completedThisMonth ?? (loading ? '—' : 0)}</div>
            <CardDescription>MTD</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(analytics?.pipelineValue ?? 0).toLocaleString()}</div>
            <CardDescription>Budget max sum</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.appointmentsCount ?? (loading ? '—' : 0)}</div>
            <CardDescription>isBooking = true</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Types</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.bookingTypeDistribution && Object.keys(analytics.bookingTypeDistribution).length ? (
              <ul className="text-sm text-gray-700 space-y-1">
                {Object.entries(analytics.bookingTypeDistribution).map(([k,v]) => (
                  <li key={k} className="flex items-center justify-between"><span>{k}</span><span className="text-gray-500">{v}</span></li>
                ))}
              </ul>
            ) : (
              <CardDescription>No booking data</CardDescription>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestStatusDistribution distribution={analytics?.statusDistribution || {}} loading={loading} />
        <TeamWorkloadChart />
      </div>
    </div>
  )
}
