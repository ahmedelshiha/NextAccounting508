'use client'

import { useMemo, useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter, useSearchParams } from 'next/navigation'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'
import { apiFetch } from '@/lib/api'
import { Download } from 'lucide-react'

interface ClientRow {
  id: string | number
  name?: string | null
  email?: string | null
  role?: string | null
  totalBookings?: number | null
  createdAt?: string | Date | null
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  if (!res.ok) return { clients: [], total: 0 }
  try {
    const json = await res.json()
    const users = (json?.users || json?.items || []) as any[]
    const clients = users.filter((u) => (u?.role || '').toUpperCase() === 'CLIENT')
    return { clients, total: clients.length }
  } catch {
    return { clients: [], total: 0 }
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default function ClientsProfilesAdminPage() {
  const router = useRouter()
  const qs = useSearchParams()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ tier?: string } | Record<string, string>>({})
  const [sortBy, setSortBy] = useState<string | undefined>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Initialize from URL on first render
  useEffect(() => {
    const q = (qs.get('q') || '').trim()
    const tier = qs.get('tier') || undefined
    const sb = qs.get('sortBy') || undefined
    const so = (qs.get('sortOrder') as 'asc' | 'desc') || 'desc'
    const p = parseInt(qs.get('page') || '1', 10)
    if (q) setSearch(q)
    if (tier) setFilters((prev) => ({ ...prev, tier }))
    if (sb) setSortBy(sb)
    if (so) setSortOrder(so)
    if (!isNaN(p) && p > 0) setPage(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep URL in sync with UI state
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (filters.tier && filters.tier !== 'all') params.set('tier', String(filters.tier))
    if (sortBy) params.set('sortBy', sortBy)
    if (sortOrder) params.set('sortOrder', sortOrder)
    if (page > 1) params.set('page', String(page))
    const s = params.toString()
    router.replace(s ? `?${s}` : '?', { scroll: false })
  }, [search, filters, sortBy, sortOrder, page, router])

  const query = buildQuery({ q: search || undefined })
  const { data, isLoading } = useSWR<{ clients: ClientRow[]; total: number }>(`/api/admin/users${query}`, fetcher)
  const items = data?.clients ?? []

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    let arr = s
      ? items.filter((u) =>
          `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(s),
        )
      : items
    if (filters.tier && filters.tier !== 'all') {
      // In absence of a tier on the model, simulate via domain hint (enterprise domains)
      const t = String(filters.tier)
      arr = arr.filter((u) =>
        t === 'smb' ? /gmail|yahoo|outlook|icloud/i.test(String(u.email || '')) : !/gmail|yahoo|outlook|icloud/i.test(String(u.email || '')),
      )
    }
    return arr
  }, [items, search, filters])

  const sorted = useMemo(() => {
    const key = String(sortBy || 'createdAt')
    const arr = [...filtered]
    arr.sort((a, b) => {
      const av = (a as any)[key]
      const bv = (b as any)[key]
      if (av == null && bv == null) return 0
      if (av == null) return sortOrder === 'asc' ? -1 : 1
      if (bv == null) return sortOrder === 'asc' ? 1 : -1
      if (key === 'createdAt') return (new Date(av).getTime() - new Date(bv).getTime()) * (sortOrder === 'asc' ? 1 : -1)
      return String(av).localeCompare(String(bv)) * (sortOrder === 'asc' ? 1 : -1)
    })
    return arr
  }, [filtered, sortBy, sortOrder])

  const start = (page - 1) * pageSize
  const rows = sorted.slice(start, start + pageSize)
  const total = sorted.length

  const columns: Column<ClientRow>[] = useMemo(
    () => [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'totalBookings', label: 'Bookings', align: 'right', render: (v) => (v == null ? '—' : v) },
      { key: 'createdAt', label: 'Joined', sortable: true, render: (v) => (v ? new Date(v as any).toLocaleDateString() : '—') },
    ],
    [],
  )

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'tier',
        label: 'Tier',
        options: [
          { value: 'all', label: 'All' },
          { value: 'smb', label: 'SMB' },
          { value: 'enterprise', label: 'Enterprise' },
        ],
        value: filters.tier || 'all',
      },
    ],
    [filters.tier],
  )

  const actions: RowAction<ClientRow>[] = [
    { label: 'Open', onClick: (row) => { window.location.href = `/admin/users?search=${encodeURIComponent(String(row.email || ''))}` } },
  ]

  const exportClients = () => {
    const params = new URLSearchParams()
    params.set('entity', 'users')
    params.set('role', 'CLIENT')
    if (search) params.set('q', search)
    if (filters.tier && filters.tier !== 'all') params.set('tier', String(filters.tier))
    window.location.href = `/api/admin/export?${params.toString()}`
  }

  return (
    <ListPage<ClientRow>
      title="Client Profiles"
      subtitle="Search and manage client accounts"
      onSearch={setSearch}
      filters={filterConfigs}
      onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
      columns={columns}
      rows={rows}
      loading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={(k) => {
        setSortBy(k)
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
      }}
      actions={actions}
      useAdvancedTable
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
      emptyMessage={search ? 'No clients match your search' : 'No clients found'}
      secondaryActions={[{ label: 'Export Clients', icon: Download, onClick: exportClients }]}
    />
  )
}
