'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface HealthLog {
  id: string
  service: string
  status: string
  message?: string | null
  checkedAt: string
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {ok ? '✅ OK' : '❌ Error'}
    </span>
  )
}

export default function StatusPage() {
  const [dbOk, setDbOk] = useState<boolean | null>(null)
  const [emailOk, setEmailOk] = useState<boolean | null>(null)
  const [logs, setLogs] = useState<HealthLog[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const [dbRes, emailRes, logsRes] = await Promise.all([
        fetch('/api/db-check', { cache: 'no-store' }),
        fetch('/api/email-check', { cache: 'no-store' }),
        fetch('/api/health/logs?limit=50', { cache: 'no-store' }),
      ])
      setDbOk(dbRes.ok)
      setEmailOk(emailRes.ok)
      const logsJson = logsRes.ok ? await logsRes.json() : []
      setLogs(Array.isArray(logsJson) ? logsJson : [])
    } catch (_err) {
      setDbOk(false)
      setEmailOk(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">System Status</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Database</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Badge variant="secondary">Checking...</Badge>
              ) : (
                <StatusPill ok={!!dbOk} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Badge variant="secondary">Checking...</Badge>
              ) : (
                <StatusPill ok={!!emailOk} />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{log.service}</td>
                      <td className="px-4 py-2 text-sm">
                        <StatusPill ok={log.status === 'ok'} />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{new Date(log.checkedAt).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{log.message || '-'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={4}>No logs yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
