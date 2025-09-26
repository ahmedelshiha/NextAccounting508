"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'

interface HealthData {
  status: 'ok'|'degraded'|'down'
  checks: { name: string; status: 'ok'|'warn'|'fail'; detail?: string }[]
}

interface SecurityEvent {
  id: string
  type: 'login'|'failed_login'|'rate_limit'|'scan_detected'
  message: string
  timestamp: string
}

export default function SecurityCenter() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackEvent('security_center_viewed', {})
    ;(async () => {
      try {
        const [h, e] = await Promise.all([
          fetch('/api/security/health').then(r => r.json()).catch(() => ({})),
          fetch('/api/security/events').then(r => r.json()).catch(() => ({})),
        ])
        setHealth(h?.data || null)
        setEvents(e?.data || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="text-gray-600">Loading...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Overview of critical security checks.</CardDescription>
        </CardHeader>
        <CardContent>
          {health ? (
            <div>
              <div className={`mb-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                health.status === 'ok' ? 'bg-green-100 text-green-800' : health.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>{health.status.toUpperCase()}</div>
              <ul className="divide-y">
                {health.checks.map((c, i) => (
                  <li key={i} className="py-2 flex items-start justify-between">
                    <div className="text-sm text-gray-800">{c.name}</div>
                    <div className={`text-xs font-medium ${
                      c.status === 'ok' ? 'text-green-700' : c.status === 'warn' ? 'text-yellow-700' : 'text-red-700'
                    }`}>{c.status.toUpperCase()}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-gray-600">No health data.</div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>Recent activity and detections.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-gray-600">No recent events.</div>
          ) : (
            <ul className="space-y-3">
              {events.map(ev => (
                <li key={ev.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-800">{ev.type.replace('_', ' ')}</div>
                    <div className="text-xs text-gray-500">{new Date(ev.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{ev.message}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
