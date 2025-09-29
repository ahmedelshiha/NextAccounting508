"use client"
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export default function AdminIntegrationsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Integrations.</div>}>
      <StandardPage title="Integrations" subtitle="View system integrations and tools">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
