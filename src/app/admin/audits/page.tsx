"use client"
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig } from '@/types/dashboard'
import { downloadExport } from '@/lib/admin-export'

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

  const { data: session } = useSession()
  const [otpRequired, setOtpRequired] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [pendingPath, setPendingPath] = useState('')
  const [pendingParams, setPendingParams] = useState('')

  async function load() {
    setLoading(true)
    try {
      const role = (session?.user as any)?.role as string | undefined
      const isSuper = role === 'SUPER_ADMIN'
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (q) params.set('q', q)
      if (!isSuper) {
        params.set('type', type)
        if (status) params.set('status', status)
      }
      const path = isSuper ? '/api/admin/audit-logs' : '/api/admin/activity'
      const url = `${path}?${params.toString()}`
      setPendingPath(path)
      setPendingParams(params.toString())
      const res = await apiFetch(url)
      if (res.ok) {
        const json = await res.json()
        const data = Array.isArray(json) ? json : json.data
        setLogs(Array.isArray(data) ? data : [])
        const meta = (json && json.pagination) ? json.pagination : { total: Array.isArray(data) ? data.length : 0 }
        setTotal(meta.total || 0)
      } else if (res.status === 401 && res.headers.get('x-step-up-required')) {
        setOtpRequired(true)
      } else {
        setLogs([])
        setTotal(0)
      }
    } finally { setLoading(false) }
  }

  async function submitOtp() {
    setOtpError('')
    try {
      const headers: Record<string, string> = { 'x-mfa-otp': otp }
      const res = await apiFetch(`${pendingPath}?${pendingParams}`, { headers })
      if (res.ok) {
        const json = await res.json()
        const data = Array.isArray(json) ? json : json.data
        setLogs(Array.isArray(data) ? data : [])
        const meta = (json && json.pagination) ? json.pagination : { total: Array.isArray(data) ? data.length : 0 }
        setTotal(meta.total || 0)
        setOtp('')
        setOtpRequired(false)
      } else {
        setOtpError('Invalid code, please try again')
      }
    } catch {
      setOtpError('Submission failed, try again')
    }
  }

  useEffect(() => { load() }, [type, page, (session?.user as any)?.role])

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
        secondaryActions={[{ label: 'Export CSV', onClick: () => downloadExport({ entity: 'audits', type, status, q, limit: '10000', format: 'csv' }) }]}
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

      {otpRequired && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
            <div className="mb-3">
              <div className="text-lg font-medium text-gray-900">Step-up verification</div>
              <div className="text-sm text-gray-600">Enter your 6-digit code to view sensitive audit logs.</div>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={otp}
                onChange={(e)=>setOtp(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123456"
                aria-label="One-time code"
              />
              {otpError && <div className="text-sm text-red-600">{otpError}</div>}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={()=>{ setOtp(''); setOtpError(''); setOtpRequired(false) }} className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50">Cancel</button>
                <button onClick={submitOtp} className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md">Verify</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PermissionGate>
  )
}
