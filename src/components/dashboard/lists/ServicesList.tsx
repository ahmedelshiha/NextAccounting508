import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import FilterBar from '@/components/dashboard/FilterBar'
import DataTable from '@/components/dashboard/DataTable'
import type { Column, FilterConfig } from '@/types/dashboard'
import { apiFetch } from '@/lib/api'
import { useTranslations } from '@/lib/i18n'

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
  if (!res.ok) return { services: [] }
  try {
    const json = await res.json()
    if (Array.isArray(json)) return { services: json }
    if (json && Array.isArray(json.services)) return { services: json.services }
    // Some APIs may return { items: [...] }
    if (json && Array.isArray(json.items)) return { services: json.items }
    return { services: [] }
  } catch {
    return { services: [] }
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default function ServicesList() {
  const { t } = useTranslations()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ status?: string; category?: string }>({})
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])

  const query = buildQuery({ q: search || undefined, status: filters.status, category: filters.category })
  const { data, isLoading, mutate } = useSWR<{ services: ServiceRow[] }>(`/api/admin/services${query}`, fetcher)
  const items = data?.services ?? []

  const onFilterChange = (key: string, value: string) => setFilters((p) => ({ ...p, [key]: value || undefined }))

  const active = useMemo(() => {
    const a: Array<{ key: string; label: string; value: string }> = []
    if (search) a.push({ key: 'q', label: t('common.search'), value: search })
    if (filters.status) a.push({ key: 'status', label: t('common.status'), value: filters.status })
    if (filters.category) a.push({ key: 'category', label: t('common.category'), value: filters.category })
    return a
  }, [search, filters, t])

  // Derive categories from current results (fallback to common set)
  const categories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((s) => { const c = (s.category || '').trim(); if (c) set.add(c) })
    const arr = Array.from(set)
    return arr.length ? arr : ['Tax','Accounting','Consulting','Advisory']
  }, [items])

  const filterConfigs: FilterConfig[] = useMemo(() => ([
    { key: 'status', label: t('common.status'), options: [
      { value: 'ACTIVE', label: t('status.active') },
      { value: 'INACTIVE', label: t('status.inactive') },
      { value: 'DRAFT', label: t('status.draft') },
    ], value: filters.status },
    { key: 'category', label: t('common.category'), options: categories.map(c => ({ value: c, label: c })), value: filters.category },
  ]), [filters.status, filters.category, categories, t])

  const columns: Column<ServiceRow>[] = useMemo(() => ([
    { key: 'id', label: t('common.id'), render: (v) => <span className="text-xs text-gray-500">{String(v).slice(0,6)}</span> },
    { key: 'name', label: t('common.name'), sortable: true },
    { key: 'category', label: t('common.category'), sortable: true },
    { key: 'price', label: t('common.price'), align: 'right', render: (v) => v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v)) },
    { key: 'status', label: t('common.status'), sortable: true },
    { key: 'updatedAt', label: t('common.updated'), sortable: true, render: (v) => v ? new Date(v as any).toLocaleString() : '—' },
  ]), [t])

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.services.title')}</h2>
        <Link href="/admin/services/new" className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">{t('dashboard.services.new')}</Link>
      </div>

      <div aria-live="polite" className="sr-only">
        {selectedIds.length > 0 ? t('dashboard.selectedCount', { count: selectedIds.length }) : t('dashboard.noSelection')}
        {active.length ? ` • ${t('dashboard.filtersActiveCount', { count: active.length })}` : ''}
      </div>

      <FilterBar
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        onSearch={(v) => setSearch(v)}
        active={active}
        searchPlaceholder={t('dashboard.search.services')}
      />

      <DataTable<ServiceRow>
        columns={columns}
        rows={items}
        loading={isLoading}
        selectable
        onSelectionChange={(ids) => setSelectedIds(ids)}
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-700">{t('dashboard.selectedCount', { count: selectedIds.length })}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => bulkUpdate('ACTIVATE')} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.activate')}</button>
            <button onClick={() => bulkUpdate('DEACTIVATE')} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.deactivate')}</button>
            <button onClick={exportCsv} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.exportCsv')}</button>
            <button onClick={() => setSelectedIds([])} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.clear')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
