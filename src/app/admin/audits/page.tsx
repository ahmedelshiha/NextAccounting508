"use client"
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig } from '@/types/dashboard'

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

  const filters: FilterConfig[] = [
    { key: 'type', label: 'Type', value: type, options: [{ value: 'AUDIT', label: 'AUDIT' }, { value: 'SYSTEM', label: 'SYSTEM' }, { value: 'EMAIL', label: 'EMAIL' }, { value: 'TASKS', label: 'TASKS' }, { value: 'REALTIME', label: 'REALTIME' }] },
    { key: 'status', label: 'Status', value: status, options: [{ value: 'ALL', label: 'ALL' }, { value: 'INFO', label: 'INFO' }, { value: 'WARN', label: 'WARN' }, { value: 'ERROR', label: 'ERROR' }] },
  ]

  const onFilterChange = (key: string, value: string) => {
    if (key === 'type') { setType(value as any); setPage(1) }
    if (key === 'status') { setStatus(value); setPage(1); setTimeout(load, 0) }
  }

  type AuditRow = { id: string; action: string; targetId?: string; status: string; checkedAt: string }

  const columns: Column<AuditRow>[] = useMemo(() => ([
    { key: 'action', label: 'Action', sortable: true },
    { key: 'targetId', label: 'Target', sortable: true, render: (v) => v ? String(v) : '' },
    { key: 'status', label: 'Status', sortable: true, render: (v: string) => (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800`}>{v}</span>
    ) },
    { key: 'checkedAt', label: 'Checked At', sortable: true, render: (v: string) => new Date(v).toLocaleString() },
  ]), [])

  const rows: AuditRow[] = useMemo(() => logs.map(l => {
    type AuditMessage = { action?: string; targetId?: string }
    let parsed: AuditMessage = {}
    try { parsed = l.message ? (JSON.parse(l.message) as AuditMessage) : {} } catch { parsed = {} }
    return { id: l.id, action: parsed.action || 'action', targetId: parsed.targetId, status: l.status, checkedAt: l.checkedAt }
  }), [logs])

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Audit Logs.</div>}>
      <ListPage<AuditRow>
        title="Audit Logs"
        subtitle="View recent admin activity and system audits"
        secondaryActions={[{ label: 'Export CSV', onClick: () => {
          const params = new URLSearchParams({ entity: 'audits', type, status, q, limit: '10000', format: 'csv' })
          window.location.href = `/api/admin/export?${params.toString()}`
        } }]}
        filters={filters}
        onFilterChange={onFilterChange}
        onSearch={(value) => { setQ(value); setPage(1); setTimeout(load, 0) }}
        columns={columns}
        rows={rows}
        loading={loading}
        useAdvancedTable
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={(p) => setPage(p)}
        emptyMessage="No audits found."
        selectable={false}
      />
    </PermissionGate>
  )
}
