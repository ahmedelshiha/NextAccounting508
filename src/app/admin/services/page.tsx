"use client"

'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig, RowAction, TabItem } from '@/types/dashboard'
import { apiFetch } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { ServiceForm } from '@/components/admin/services/ServiceForm'
import { ServicesAnalytics } from '@/components/admin/services/ServicesAnalytics'

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
  if (!res.ok) return { services: [], total: 0, analytics: null }
  try {
    const json = await res.json()
    const services = Array.isArray(json)
      ? json
      : (Array.isArray(json?.services) ? json.services : (Array.isArray(json?.items) ? json.items : []))
    const total = typeof json?.total === 'number' ? json.total : services.length
    const analytics = json?.analytics ?? null
    return { services, total, analytics }
  } catch {
    return { services: [], total: 0, analytics: null }
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default function ServicesAdminPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ status?: string; category?: string }>({})
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const [sortBy, setSortBy] = useState<string | undefined>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [editing, setEditing] = useState<ServiceRow | null>(null)
  const [showModal, setShowModal] = useState(false)

  const query = buildQuery({ search: search || undefined, status: filters.status && filters.status !== 'all' ? filters.status : undefined, category: filters.category, limit: String(pageSize), offset: String((page-1)*pageSize), sortBy, sortOrder })
  const { data, isLoading, mutate } = useSWR<{ services: ServiceRow[]; total: number; analytics: any }>(`/api/admin/services${query}`, fetcher)
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
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ], value: (filters.status as any) ?? 'all' },
    { key: 'category', label: 'Category', options: (() => {
      const set = new Set<string>()
      items.forEach((s) => { const c = (s.category || '').trim(); if (c) set.add(c) })
      const arr = Array.from(set)
      return arr.length ? arr.map(c => ({ value: c, label: c })) : ['Tax','Accounting','Consulting','Advisory'].map(c => ({ value: c, label: c }))
    })(), value: filters.category },
  ]), [filters.status, filters.category, items])

  const actions: RowAction<ServiceRow>[] = [
    { label: 'Open', onClick: (row) => { window.location.href = `/admin/services/${row.id}` } },
    { label: 'Edit', onClick: (row) => { setEditing(row); setShowModal(true) } },
  ]

  const exportCsv = async () => {
    try {
      const qs = new URLSearchParams()
      if (search) qs.set('search', search)
      if (filters.status && filters.status !== 'all') qs.set('status', filters.status)
      if (filters.category) qs.set('category', filters.category)
      const res = await apiFetch(`/api/admin/services/export?${qs.toString()}`)
      if (!res.ok) {
        const { toastFromResponse } = await import('@/lib/toast-api')
        await toastFromResponse(res, { failure: 'Export failed' })
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `services-${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      const { toastSuccess } = await import('@/lib/toast-api')
      toastSuccess('Export ready')
    } catch (e) {
      const { toastError } = await import('@/lib/toast-api')
      toastError(e, 'Export failed')
    }
  }

  const bulkUpdate = async (action: 'ACTIVATE' | 'DEACTIVATE') => {
    if (!selectedIds.length) return
    try {
      const res = await apiFetch('/api/admin/services/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids: selectedIds }) })
      if (!res.ok) {
        const { toastFromResponse } = await import('@/lib/toast-api')
        await toastFromResponse(res, { failure: 'Bulk update failed' })
        return
      }
      const { toastSuccess } = await import('@/lib/toast-api')
      toastSuccess('Bulk update applied')
      setSelectedIds([])
      await mutate()
    } catch (e) {
      const { toastError } = await import('@/lib/toast-api')
      toastError(e, 'Bulk update failed')
    }
  }

  const primaryTabs: TabItem[] = [
    { key: 'list', label: 'List' },
    { key: 'analytics', label: 'Analytics' },
  ]
  const [activeTab, setActiveTab] = useState<string>('list')

  return (
    <div className="px-6 py-4">
      {activeTab === 'analytics' ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Services Analytics</h2>
            <button onClick={() => setActiveTab('list')} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Back to List</button>
          </div>
          <ServicesAnalytics analytics={data?.analytics ?? null} loading={isLoading && !data?.analytics} />
        </div>
      ) : (
        <ListPage<ServiceRow>
          title="Services Management"
          subtitle="Manage your service offerings, pricing, and availability"
          primaryAction={{ label: 'New Service', onClick: () => { setEditing(null); setShowModal(true) } }}
          secondaryActions={[{ label: 'Export', onClick: exportCsv }, { label: 'Analytics', onClick: () => setActiveTab('analytics') }, { label: 'Refresh', onClick: () => mutate() }]}
          primaryTabs={primaryTabs}
          activePrimaryTab={activeTab}
          onPrimaryTabChange={setActiveTab}
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
      )}

      {showModal && (
        <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null) }} title={editing ? `Edit: ${editing.name ?? ''}` : 'Create Service'}>
          <ServiceForm
            initialData={editing as any}
            onSubmit={async (form) => {
              const method = editing ? 'PATCH' : 'POST'
              const url = editing ? `/api/admin/services/${editing.id}` : '/api/admin/services'
              try {
                const res = await apiFetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) })
                if (!res.ok) {
                  const { toastFromResponse } = await import('@/lib/toast-api')
                  await toastFromResponse(res, { failure: editing ? 'Update failed' : 'Create failed' })
                  return
                }
                const { toastSuccess } = await import('@/lib/toast-api')
                toastSuccess(editing ? 'Service updated' : 'Service created')
                setShowModal(false); setEditing(null); await mutate()
              } catch (e) {
                const { toastError } = await import('@/lib/toast-api')
                toastError(e, editing ? 'Update failed' : 'Create failed')
              }
            }}
            onCancel={() => { setShowModal(false); setEditing(null) }}
            categories={(() => {
              const set = new Set<string>()
              items.forEach((s) => { const c = (s.category || '').trim(); if (c) set.add(c) })
              return Array.from(set)
            })()}
          />
        </Modal>
      )}
    </div>
  )
}
