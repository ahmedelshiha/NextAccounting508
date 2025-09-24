"use client"

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import FilterBar from '@/components/dashboard/FilterBar'
import DataTable from '@/components/dashboard/DataTable'
import type { Column, FilterConfig } from '@/types/dashboard'
import { apiFetch } from '@/lib/api'

interface TaskRow {
  id: string | number
  title?: string | null
  assignee?: { id?: string; name?: string | null; email?: string | null } | null
  status?: string | null
  dueAt?: string | Date | null
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  if (!res.ok) return { tasks: [] }
  try {
    const json = await res.json()
    if (Array.isArray(json)) return { tasks: json }
    if (json && Array.isArray(json.tasks)) return { tasks: json.tasks }
    if (json && Array.isArray(json.items)) return { tasks: json.items }
    return { tasks: [] }
  } catch {
    return { tasks: [] }
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default function TasksList() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ status?: string; assigneeId?: string; range?: string }>({})
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])

  const now = new Date()
  const dateFrom = useMemo(() => {
    if (filters.range === 'overdue') return undefined
    if (filters.range === '7d') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString() }
    if (filters.range === '30d') { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString() }
    return undefined
  }, [filters.range])
  const dueBefore = useMemo(() => {
    if (filters.range === 'overdue') return new Date().toISOString()
    return undefined
  }, [filters.range])

  const query = buildQuery({ q: search || undefined, status: filters.status, assigneeId: filters.assigneeId, dateFrom, dueBefore })
  const { data, isLoading, mutate } = useSWR<{ tasks: TaskRow[] }>(`/api/admin/tasks${query}`, fetcher)
  const items = data?.tasks ?? []

  const onFilterChange = (key: string, value: string) => setFilters((p) => ({ ...p, [key]: value || undefined }))

  const active = useMemo(() => {
    const a: Array<{ key: string; label: string; value: string }> = []
    if (search) a.push({ key: 'q', label: 'Search', value: search })
    if (filters.status) a.push({ key: 'status', label: 'Status', value: filters.status })
    if (filters.assigneeId) a.push({ key: 'assigneeId', label: 'Assignee', value: filters.assigneeId })
    if (filters.range) a.push({ key: 'range', label: 'Date', value: filters.range === 'overdue' ? 'Overdue' : (filters.range === '7d' ? 'Last 7 days' : 'Last 30 days') })
    return a
  }, [search, filters])

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [
      { value: 'OPEN', label: 'Open' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'BLOCKED', label: 'Blocked' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ], value: filters.status },
    { key: 'range', label: 'Date', options: [
      { value: 'overdue', label: 'Overdue' },
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
    ], value: filters.range },
  ]

  const columns: Column<TaskRow>[] = [
    { key: 'id', label: 'ID', render: (v) => <span className="text-xs text-gray-500">{String(v).slice(0,6)}</span> },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'assignee', label: 'Assignee', render: (v) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{v?.name || '—'}</span>
        <span className="text-xs text-gray-500">{v?.email || ''}</span>
      </div>
    ) },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'dueAt', label: 'Due', sortable: true, render: (v) => v ? new Date(v as any).toLocaleString() : '—' },
  ]

  const exportCsv = async () => {
    const qs = new URLSearchParams()
    if (search) qs.set('q', search)
    if (filters.status) qs.set('status', filters.status)
    if (filters.assigneeId) qs.set('assigneeId', filters.assigneeId)
    if (filters.range === 'overdue') qs.set('dueBefore', new Date().toISOString())
    if (filters.range === '7d') qs.set('dateFrom', new Date(Date.now() - 7*24*60*60*1000).toISOString())
    if (filters.range === '30d') qs.set('dateFrom', new Date(Date.now() - 30*24*60*60*1000).toISOString())
    const res = await apiFetch(`/api/admin/tasks/export?${qs.toString()}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const setStatusBulk = async () => {
    if (!selectedIds.length) return
    const next = window.prompt('Set status to (OPEN, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED):')?.toUpperCase()
    if (!next || !['OPEN','IN_PROGRESS','BLOCKED','COMPLETED','CANCELLED'].includes(next)) return
    await apiFetch('/api/admin/tasks/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', taskIds: selectedIds, status: next }) })
    setSelectedIds([])
    await mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
      </div>

      <div aria-live="polite" className="sr-only">
        {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'No selection'}
        {active.length ? ` • ${active.length} filters active` : ''}
      </div>

      <FilterBar
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        onSearch={(v) => setSearch(v)}
        active={active}
        searchPlaceholder="Search tasks…"
      />

      <DataTable<TaskRow>
        columns={columns}
        rows={items}
        loading={isLoading}
        selectable
        onSelectionChange={(ids) => setSelectedIds(ids)}
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-700">{selectedIds.length} selected</div>
          <div className="flex items-center gap-2">
            <button onClick={setStatusBulk} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Set Status</button>
            <button onClick={exportCsv} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Export CSV</button>
            <button onClick={() => setSelectedIds([])} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}
