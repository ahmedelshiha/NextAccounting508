"use client"
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import StandardPage from '@/components/dashboard/templates/StandardPage'

interface AuditLog { id: string; service: string; status: string; message: string | null; checkedAt: string }

const TYPES = ['AUDIT', 'SYSTEM', 'EMAIL', 'TASKS', 'REALTIME'] as const
const STATUSES = ['INFO', 'WARN', 'ERROR'] as const

export default function AdminAuditsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [type, setType] = useState<(typeof TYPES)[number]>('AUDIT')
  const [status, setStatus] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type, page: String(page), limit: String(limit) })
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      const res = await apiFetch(`/api/admin/activity?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        const data = Array.isArray(json) ? json : json.data
        setLogs(Array.isArray(data) ? data : [])
        const meta = (json && json.pagination) ? json.pagination : { total: Array.isArray(data) ? data.length : 0 }
        setTotal(meta.total || 0)
      } else {
        setLogs([])
        setTotal(0)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [type, page])

  const pageCount = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [total, limit])

  function exportCsv() {
    const params = new URLSearchParams({ entity: 'audits', type, status, q, limit: '10000', format: 'csv' })
    const url = `/api/admin/export?${params.toString()}`
    const a = document.createElement('a')
    a.href = url
    a.download = `audits-${type.toLowerCase()}-p${page}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const canPrev = page > 1
  const canNext = page < pageCount

  return (
    <StandardPage title="Audit Logs" subtitle="View recent admin activity and system audits" secondaryActions={[{ label: 'Export CSV', onClick: exportCsv }]}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search audit entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input placeholder="Search message..." value={q} onChange={e => setQ(e.target.value)} />
              <Button variant="outline" onClick={() => { setPage(1); load() }}>Search</Button>
            </div>
            <div className="flex gap-2">
              <Select value={type} onValueChange={v => { setType(v as any); setPage(1) }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={v => { setStatus(v); setPage(1); setTimeout(load, 0) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ALL</SelectItem>
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
          <CardDescription>
            Page {page} of {pageCount} • Total {total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-16" />))}
            </div>
          ) : logs.length ? (
            <div className="divide-y divide-gray-100">
              {logs.map(l => {
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

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-600">Showing {logs.length} of {total}</div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={!canPrev} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                  <Button variant="outline" disabled={!canNext} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No audits found.</div>
          )}
        </CardContent>
      </Card>
    </StandardPage>
  )
}
