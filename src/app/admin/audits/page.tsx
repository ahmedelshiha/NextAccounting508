"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AuditLog { id: string; service: string; status: string; message: string | null; checkedAt: string }

export default function AdminAuditsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  async function load() {
    try {
      const res = await apiFetch('/api/health/logs?service=AUDIT&limit=200')
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = logs.filter(l => {
    if (!q) return true
    const t = (l.message || '').toLowerCase()
    return t.includes(q.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">View recent admin activity and system audits</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search audit entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input placeholder="Search message..." value={q} onChange={e => setQ(e.target.value)} />
              <Button variant="outline" onClick={load}>Refresh</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest {filtered.length} entries</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-16" />))}
              </div>
            ) : filtered.length ? (
              <div className="divide-y divide-gray-100">
                {filtered.map(l => {
                  let parsed: any = {}
                  try { parsed = l.message ? JSON.parse(l.message) : {} } catch {}
                  return (
                    <div key={l.id} className="py-3 flex items-center justify-between">
                      <div className="min-w-0 mr-4">
                        <div className="text-sm text-gray-900 truncate">{parsed.action || 'action'}</div>
                        <div className="text-xs text-gray-600 truncate">{parsed.targetId ? `target: ${parsed.targetId}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800">{l.status}</Badge>
                        <div className="text-xs text-gray-500">{new Date(l.checkedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-gray-500">No audits found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
