"use client"
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AuditLog { id: string; service: string; status: string; message: string | null; checkedAt: string }

const TYPES = ['AUDIT', 'SYSTEM', 'EMAIL', 'TASKS', 'REALTIME'] as const
const STATUSES = ['INFO', 'WARN', 'ERROR'] as const

export default function AdminAuditsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [type, setType] = useState<(typeof TYPES)[number]>('AUDIT')
  const [status, setStatus] = useState<string>('')

  async function load() {
    setLoading(true)
    try {
      const url = `/api/admin/activity?type=${encodeURIComponent(type)}&limit=200`
      const res = await apiFetch(url)
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      } else {
        setLogs([])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [type])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (status && l.status !== status) return false
      if (!q) return true
      const t = `${l.message || ''}`.toLowerCase()
      return t.includes(q.toLowerCase())
    })
  }, [logs, q, status])

  function exportCsv() {
    const rows = filtered.map(l => {
      let action = ''
      try { action = JSON.parse(l.message || '{}')?.action || '' } catch {}
      return {
        id: l.id,
        service: l.service,
        status: l.status,
        action,
        checkedAt: l.checkedAt,
      }
    })
    const header = Object.keys(rows[0] || { id: '', service: '', status: '', action: '', checkedAt: '' })
    const csv = [header.join(','), ...rows.map(r => header.map(k => JSON.stringify((r as any)[k] ?? '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audits-${type.toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <Input placeholder="Search message..." value={q} onChange={e => setQ(e.target.value)} />
                <Button variant="outline" onClick={load}>Refresh</Button>
              </div>
              <div className="flex gap-2">
                <Select value={type} onValueChange={v => setType(v as any)}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={v => setStatus(v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ALL</SelectItem>
                    {STATUSES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button onClick={exportCsv}>Export CSV</Button>
              </div>
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
                  type AuditMessage = { action?: string; targetId?: string; details?: unknown }
                  let parsed: AuditMessage = {}
                  try { parsed = l.message ? (JSON.parse(l.message) as AuditMessage) : {} } catch { parsed = {} }
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
