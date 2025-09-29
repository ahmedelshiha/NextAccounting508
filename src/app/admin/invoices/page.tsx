"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

interface InvoiceRow {
  id: string
  date: string
  client: string
  status: 'draft' | 'sent' | 'unpaid' | 'paid' | 'void'
  amount: number
}

type ApiInvoice = {
  id: string
  createdAt: string
  paidAt?: string | null
  status: 'DRAFT'|'SENT'|'UNPAID'|'PAID'|'VOID'
  totalCents: number
  currency: string
  client?: { id: string; name: string | null; email: string | null } | null
}

type ApiResponse = { invoices: ApiInvoice[]; total: number; page?: number; limit?: number }

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to load invoices')
  return r.json() as Promise<ApiResponse>
})

function computeDateRange(range: string): { from?: string; to?: string } {
  const now = new Date()
  const end = new Date(now)
  let start: Date | undefined
  if (range === 'last_7') {
    start = new Date(now); start.setDate(now.getDate() - 7)
  } else if (range === 'last_30') {
    start = new Date(now); start.setDate(now.getDate() - 30)
  } else if (range === 'quarter') {
    const month = now.getMonth(); const qStartMonth = Math.floor(month / 3) * 3
    start = new Date(now.getFullYear(), qStartMonth, 1)
  } else if (range === 'year') {
    start = new Date(now.getFullYear(), 0, 1)
  }
  const fmt = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
  return { from: start ? fmt(start) : undefined, to: fmt(end) }
}

export default function AdminInvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<string>('all')
  const [range, setRange] = useState<string>('last_30')
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  // Initialize from URL
  useEffect(() => {
    if (!searchParams) return
    const get = (k: string) => searchParams.get(k) || ''
    const s = get('status'); if (s) setStatus(s)
    const r = get('range'); if (r) setRange(r)
    const p = Number(get('page')); if (Number.isFinite(p) && p > 0) setPage(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (range && range !== 'last_30') params.set('range', range)
    if (page && page !== 1) params.set('page', String(page))
    const qs = params.toString()
    const href = qs ? `/admin/invoices?${qs}` : '/admin/invoices'
    router.replace(href)
  }, [status, range, page, router])

  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', value: status, options: [
      { value: 'all', label: 'All' },
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'unpaid', label: 'Unpaid' },
      { value: 'paid', label: 'Paid' },
      { value: 'void', label: 'Void' },
    ]},
    { key: 'range', label: 'Date Range', value: range, options: [
      { value: 'last_7', label: 'Last 7 days' },
      { value: 'last_30', label: 'Last 30 days' },
      { value: 'quarter', label: 'This quarter' },
      { value: 'year', label: 'This year' },
    ]},
  ]

  const onFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatus(value)
    if (key === 'range') setRange(value)
  }

  const { from, to } = computeDateRange(range)
  const apiUrl = useMemo(() => {
    const u = new URL('/api/admin/invoices', window.location.origin)
    if (status && status !== 'all') u.searchParams.set('status', status.toUpperCase())
    if (from) u.searchParams.set('createdFrom', from)
    if (to) u.searchParams.set('createdTo', to)
    u.searchParams.set('page', String(page))
    u.searchParams.set('limit', String(pageSize))
    u.searchParams.set('sortBy', 'createdAt')
    u.searchParams.set('sortOrder', 'desc')
    return u.pathname + '?' + u.searchParams.toString()
  }, [status, from, to, page])

  const { data, isLoading } = useSWR<ApiResponse>(apiUrl, fetcher)

  const columns: Column<InvoiceRow>[] = useMemo(() => ([
    { key: 'date', label: 'Date', sortable: true },
    { key: 'client', label: 'Client', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (v) => (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        v === 'paid' ? 'bg-green-100 text-green-800' :
        v === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
        v === 'sent' ? 'bg-blue-100 text-blue-800' :
        v === 'draft' ? 'bg-gray-100 text-gray-800' :
        'bg-gray-100 text-gray-800'
      }`}>{String(v).toUpperCase()}</span>
    ) },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v: number) => `$${v.toFixed(2)}` },
  ]), [])

  const rows: InvoiceRow[] = useMemo(() => {
    const list = data?.invoices || []
    return list.map(inv => ({
      id: inv.id,
      date: inv.paidAt || inv.createdAt,
      client: inv.client?.name || inv.client?.email || '—',
      status: inv.status.toLowerCase() as InvoiceRow['status'],
      amount: (inv.totalCents || 0) / 100,
    }))
  }, [data])

  const total = data?.total ?? 0

  const actions: RowAction<InvoiceRow>[] = [
    { label: 'View', onClick: (row) => { window.alert(`Open invoice ${row.id}`) } },
  ]

  const exportHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('entity', 'invoices')
    if (status && status !== 'all') params.set('status', status.toUpperCase())
    if (from) params.set('createdFrom', from)
    if (to) params.set('createdTo', to)
    return `/api/admin/export?${params.toString()}`
  }, [status, from, to])

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Invoices.</div>}>
      <ListPage<InvoiceRow>
        title="Invoices"
        subtitle="Track invoices and statuses; use Reports for exports"
        secondaryActions={[
          { label: 'Open Reports', onClick: () => { window.location.href = '/admin/reports' } },
          { label: 'Export CSV', onClick: () => { window.location.href = exportHref } },
          { label: 'Automated Billing', onClick: () => { window.location.href = '/admin/invoices/sequences' } },
        ]}
        filters={filters}
        onFilterChange={onFilterChange}
        columns={columns}
        rows={rows}
        useAdvancedTable
        emptyMessage="No invoices found"
        actions={actions}
        selectable={false}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </PermissionGate>
  )
}
