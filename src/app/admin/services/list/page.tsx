"use client"

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'
import { apiFetch } from '@/lib/api'

interface ServiceRow {
  id: string | number
  name?: string | null
  category?: string | null
  price?: number | string | null
  status?: string | null
  updatedAt?: string | Date | null
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  if (!res.ok) return { services: [], total: 0 }
  try {
    const json = await res.json()
    if (Array.isArray(json)) return { services: json, total: json.length }
    const services = Array.isArray(json?.services) ? json.services : (Array.isArray(json?.items) ? json.items : [])
    const total = typeof json?.total === 'number' ? json.total : services.length
    return { services, total }
  } catch {
    return { services: [], total: 0 }
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default function ServicesListPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ status?: string; category?: string }>({})
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const [sortBy, setSortBy] = useState<string | undefined>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const query = buildQuery({ q: search || undefined, status: filters.status, category: filters.category, limit: String(pageSize), offset: String((page-1)*pageSize), sortBy, sortOrder })
  const { data, isLoading, mutate } = useSWR<{ services: ServiceRow[]; total: number }>(`/api/admin/services${query}`, fetcher)
  const items = data?.services ?? []
  const total = data?.total ?? items.length

  const onFilterChange = (key: string, value: string) => setFilters((p) => ({ ...p, [key]: value || undefined }))

  const columns: Column<ServiceRow>[] = useMemo(() => ([
    { key: 'id', label: 'ID', render: (v) => <span className="text-xs text-gray-500">{String(v).slice(0,6)}</span> },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'price', label: 'Price', align: 'right', render: (v) => v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v)) },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'updatedAt', label: 'Updated', sortable: true, render: (v) => v ? new Date(v as any).toLocaleString() : '—' },
  ]), [])

  const filterConfigs: FilterConfig[] = useMemo(() => ([
    { key: 'status', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'DRAFT', label: 'Draft' },
    ], value: filters.status },
    { key: 'category', label: 'Category', options: (() => {
      const set = new Set<string>()
      items.forEach((s) => { const c = (s.category || '').trim(); if (c) set.add(c) })
      const arr = Array.from(set)
      return arr.length ? arr.map(c => ({ value: c, label: c })) : ['Tax','Accounting','Consulting','Advisory'].map(c => ({ value: c, label: c }))
    })(), value: filters.category },
  ]), [filters.status, filters.category, items])

  const actions: RowAction<ServiceRow>[] = [
    { label: 'Open', onClick: (row) => { window.location.href = `/admin/services/${row.id}` } },
  ]

  const exportCsv = async () => {
    const qs = new URLSearchParams()
    if (search) qs.set('q', search)
    if (filters.status) qs.set('status', filters.status)
    if (filters.category) qs.set('category', filters.category)
    const res = await apiFetch(`/api/admin/services/export?${qs.toString()}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `services-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const bulkUpdate = async (action: 'ACTIVATE' | 'DEACTIVATE') => {
    if (!selectedIds.length) return
    await apiFetch('/api/admin/services/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids: selectedIds }) })
    setSelectedIds([])
    await mutate()
  }

  return (
    <ListPage<ServiceRow>
      title="Services"
      subtitle="Activate, deactivate, and export services"
      primaryAction={{ label: 'New Service', onClick: () => (window.location.href = '/admin/services/new') }}
      secondaryActions={[{ label: 'Export CSV', onClick: exportCsv }, { label: 'Refresh', onClick: () => mutate() }]}
      filters={filterConfigs}
      onFilterChange={onFilterChange}
      onSearch={(v) => setSearch(v)}
      searchPlaceholder="Search services"
      columns={columns}
      rows={items}
      loading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={(key) => setSortBy(key)}
      actions={actions}
      selectable
      useAdvancedTable
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
      emptyMessage="No services found"
      renderBulkActions={(ids) => (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">{ids.length} selected</div>
          <div className="flex items-center gap-2">
            <button onClick={() => bulkUpdate('ACTIVATE')} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Activate</button>
            <button onClick={() => bulkUpdate('DEACTIVATE')} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Deactivate</button>
            <button onClick={exportCsv} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Export CSV</button>
          </div>
        </div>
      )}
    />
  )
}
