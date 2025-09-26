"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'

interface ComplianceData {
  filingsDue: { title: string; dueDate: string; status: 'pending'|'completed'|'overdue' }[]
  kyc: { entity: string; status: 'verified'|'pending'|'expired' }[]
  alerts: { id: string; message: string; severity: 'info'|'warning'|'critical' }[]
}

export default function ComplianceDashboard() {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackEvent('compliance_viewed', {})
    ;(async () => {
      try {
        const res = await fetch('/api/compliance/overview')
        const json = await res.json().catch(() => ({}))
        setData(json?.data || null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const dismissAlert = (id: string) => {
    setData((prev) => prev ? { ...prev, alerts: prev.alerts.filter(a => a.id !== id) } : prev)
    trackEvent('alert_dismissed', { id })
  }

  if (loading) return <div className="text-gray-600">Loading...</div>
  if (!data) return <div className="text-gray-600">No compliance data available.</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Filings Due</CardTitle>
          <CardDescription>Upcoming and overdue compliance filings.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {data.filingsDue.map((f, i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{f.title}</div>
                  <div className="text-sm text-gray-600">Due {f.dueDate}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  f.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  f.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>{f.status.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KYC / KYB</CardTitle>
          <CardDescription>Verification status by entity.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.kyc.map((k, i) => (
              <li key={i} className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{k.entity}</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  k.status === 'verified' ? 'bg-green-100 text-green-800' :
                  k.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>{k.status.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Important compliance notices.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.alerts.length === 0 ? (
            <div className="text-gray-600">No alerts.</div>
          ) : (
            <ul className="space-y-3">
              {data.alerts.map((a) => (
                <li key={a.id} className="p-3 rounded border flex items-start justify-between">
                  <div>
                    <div className={`text-sm font-medium ${
                      a.severity === 'critical' ? 'text-red-700' : a.severity === 'warning' ? 'text-yellow-700' : 'text-gray-800'
                    }`}>{a.message}</div>
                    <div className="text-xs text-gray-500 mt-1">Severity: {a.severity}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => dismissAlert(a.id)} aria-label="Dismiss alert">Dismiss</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
