"use client"

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import FilterBar from '@/components/dashboard/FilterBar'
import DataTable from '@/components/dashboard/DataTable'
import type { Column, FilterConfig } from '@/types/dashboard'
import { apiFetch } from '@/lib/api'

interface UserRow {
  id: string | number
  name?: string | null
  email?: string | null
  role?: string | null
  status?: string | null
  createdAt?: string | Date | null
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  if (!res.ok) return { users: [] }
  try {
    const json = await res.json()
    if (Array.isArray(json)) return { users: json }
    if (json && Array.isArray(json.users)) return { users: json.users }
    return { users: [] }
  } catch {
    return { users: [] }
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default function ClientsList() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ role?: string; status?: string; range?: string }>({})
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])

  // Translate date range to dateFrom/dateTo
  const now = new Date()
  const dateFrom = useMemo(() => {
    if (filters.range === '7d') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString() }
    if (filters.range === '30d') { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString() }
    return undefined
  }, [filters.range])

  const query = buildQuery({ q: search || undefined, role: filters.role, status: filters.status, dateFrom })
  const { data, isLoading, mutate } = useSWR<{ users: UserRow[] }>(`/api/admin/users${query}`, fetcher)
  const items = data?.users ?? []

  const onFilterChange = (key: string, value: string) => setFilters((p) => ({ ...p, [key]: value || undefined }))

  const active = useMemo(() => {
    const a: Array<{ key: string; label: string; value: string }> = []
    if (search) a.push({ key: 'q', label: 'Search', value: search })
    if (filters.role) a.push({ key: 'role', label: 'Role', value: filters.role })
    if (filters.status) a.push({ key: 'status', label: 'Status', value: filters.status })
    if (filters.range) a.push({ key: 'range', label: 'Date', value: filters.range === '7d' ? 'Last 7 days' : 'Last 30 days' })
    return a
  }, [search, filters])

  const filterConfigs: FilterConfig[] = [
    { key: 'role', label: 'Role', options: [
      { value: 'ADMIN', label: 'Admin' },
      { value: 'STAFF', label: 'Staff' },
      { value: 'CLIENT', label: 'Client' },
    ], value: filters.role },
    { key: 'status', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ], value: filters.status },
    { key: 'range', label: 'Date', options: [
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
    ], value: filters.range },
  ]

  const columns: Column<UserRow>[] = [
    { key: 'id', label: 'ID', render: (v) => <span className="text-xs text-gray-500">{String(v).slice(0,6)}</span> },
    { key: 'name', label: 'Name', sortable: true, render: (v, r) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{v || '—'}</span>
        <span className="text-xs text-gray-500">{r.email || '—'}</span>
      </div>
    ) },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true, render: (v) => v ? new Date(v as any).toLocaleString() : '—' },
  ]

  const setRoleBulk = async () => {
    if (!selectedIds.length) return
    const next = window.prompt('Set role to (ADMIN, STAFF, CLIENT):')?.toUpperCase()
    if (!next || !['ADMIN','STAFF','CLIENT'].includes(next)) return
    for (const id of selectedIds) {
      await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: next }) })
    }
    setSelectedIds([])
    await mutate()
  }

  const setStatusBulk = async () => {
    if (!selectedIds.length) return
    const next = window.prompt('Set status to (ACTIVE, INACTIVE, SUSPENDED):')?.toUpperCase()
    if (!next || !['ACTIVE','INACTIVE','SUSPENDED'].includes(next)) return
    for (const id of selectedIds) {
      await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    }
    setSelectedIds([])
    await mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
        <Link href="/admin/clients/new" className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">New Client</Link>
      </div>

      {/* A11y live region for SR updates */}
      <div aria-live="polite" className="sr-only">
        {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'No selection'}
        {active.length ? ` • ${active.length} filters active` : ''}
      </div>

      <FilterBar
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        onSearch={(v) => setSearch(v)}
        active={active}
        searchPlaceholder="Search name or email…"
      />

      <DataTable<UserRow>
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
            <button onClick={setRoleBulk} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Set Role</button>
            <button onClick={setStatusBulk} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Set Status</button>
            <button onClick={() => setSelectedIds([])} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}
