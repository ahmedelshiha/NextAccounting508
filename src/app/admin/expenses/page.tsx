"use client"

import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useRouter, useSearchParams } from 'next/navigation'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

interface ExpenseRow {
  id: string
  date: string
  category: string
  vendor: string
  status: 'pending' | 'approved' | 'reimbursed' | 'rejected'
  amount: number
  avStatus?: string
  attachmentUrl?: string
}

type ApiExpense = {
  id: string
  vendor: string
  category: string
  status: 'PENDING'|'APPROVED'|'REIMBURSED'|'REJECTED'
  amountCents: number
  currency: string
  date: string
  attachment?: { id: string; url?: string | null; avStatus?: string | null } | null
}

type ApiResponse = { expenses: ApiExpense[]; total: number; page?: number; limit?: number }

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error('Failed to load expenses'); return r.json() as Promise<ApiResponse> })

function computeDateRange(range: string): { from?: string; to?: string } {
  const now = new Date()
  const end = new Date(now)
  let start: Date | undefined
  if (range === 'last_7') start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  else if (range === 'last_30') start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  else if (range === 'quarter') { const m = now.getMonth(); start = new Date(now.getFullYear(), Math.floor(m/3)*3, 1) }
  else if (range === 'year') start = new Date(now.getFullYear(), 0, 1)
  const iso = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
  return { from: start ? iso(start) : undefined, to: iso(end) }
}

export default function AdminExpensesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [range, setRange] = useState<string>('last_30')
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  // Initialize from URL
  useEffect(() => {
    if (!searchParams) return
    const get = (k: string) => searchParams.get(k) || ''
    const s = get('status'); if (s) setStatus(s)
    const c = get('category'); if (c) setCategory(c)
    const r = get('range'); if (r) setRange(r)
    const p = Number(get('page')); if (Number.isFinite(p) && p > 0) setPage(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (category && category !== 'all') params.set('category', category)
    if (range && range !== 'last_30') params.set('range', range)
    if (page && page !== 1) params.set('page', String(page))
    const qs = params.toString()
    const href = qs ? `/admin/expenses?${qs}` : '/admin/expenses'
    router.replace(href)
  }, [status, category, range, page, router])

  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', value: status, options: [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'reimbursed', label: 'Reimbursed' },
      { value: 'rejected', label: 'Rejected' },
    ]},
    { key: 'category', label: 'Category', value: category, options: [
      { value: 'all', label: 'All' },
      { value: 'software', label: 'Software' },
      { value: 'payroll', label: 'Payroll' },
      { value: 'rent', label: 'Rent' },
      { value: 'utilities', label: 'Utilities' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'travel', label: 'Travel' },
      { value: 'other', label: 'Other' },
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
    if (key === 'category') setCategory(value)
    if (key === 'range') setRange(value)
  }

  const { from, to } = computeDateRange(range)
  const apiUrl = useMemo(() => {
    const u = new URL('/api/admin/expenses', window.location.origin)
    if (status && status !== 'all') u.searchParams.set('status', status.toUpperCase())
    if (category && category !== 'all') u.searchParams.set('category', category)
    if (from) u.searchParams.set('dateFrom', from)
    if (to) u.searchParams.set('dateTo', to)
    u.searchParams.set('page', String(page))
    u.searchParams.set('limit', String(pageSize))
    u.searchParams.set('sortBy', 'date')
    u.searchParams.set('sortOrder', 'desc')
    return u.pathname + '?' + u.searchParams.toString()
  }, [status, category, from, to, page])

  const { data, isLoading } = useSWR<ApiResponse>(apiUrl, fetcher)

  const columns: Column<ExpenseRow>[] = useMemo(() => ([
    { key: 'date', label: 'Date', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: true, render: (_v, row) => (
      <div className="flex items-center gap-2">
        {row.avStatus ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            row.avStatus === 'clean' ? 'bg-green-100 text-green-800' :
            row.avStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            row.avStatus === 'infected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>{row.avStatus}</span>
        ) : null}
        <span>{row.vendor}</span>
      </div>
    ) },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (v) => (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        v === 'approved' ? 'bg-green-100 text-green-800' :
        v === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        v === 'reimbursed' ? 'bg-blue-100 text-blue-800' :
        v === 'rejected' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>{String(v).toUpperCase()}</span>
    ) },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v: number) => `$${v.toFixed(2)}` },
  ]), [])

  const rows: ExpenseRow[] = useMemo(() => {
    const list = data?.expenses || []
    return list.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      vendor: e.vendor,
      status: e.status.toLowerCase() as ExpenseRow['status'],
      amount: (e.amountCents || 0)/100,
      avStatus: e.attachment?.avStatus || undefined,
      attachmentUrl: e.attachment?.url || undefined,
    }))
  }, [data])

  const exportHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('entity', 'expenses')
    if (status && status !== 'all') params.set('status', status.toUpperCase())
    if (category && category !== 'all') params.set('category', category)
    if (from) params.set('dateFrom', from)
    if (to) params.set('dateTo', to)
    return `/api/admin/export?${params.toString()}`
  }, [status, category, from, to])

  const actions: RowAction<ExpenseRow>[] = [
    { label: 'View Receipt', onClick: (row) => { if (row.attachmentUrl) window.open(row.attachmentUrl, '_blank') } },
  ]

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Expenses.</div>}>
      <ListPage<ExpenseRow>
        title="Expenses"
        subtitle="Track company expenses; export CSV or open uploads quarantine for raw files"
        secondaryActions={[
          { label: 'Open Reports', onClick: () => { window.location.href = '/admin/reports' } },
          { label: 'Export CSV', onClick: () => { window.location.href = exportHref } },
          { label: 'Uploads Quarantine', onClick: () => { window.location.href = '/admin/uploads/quarantine' } },
        ]}
        filters={filters}
        onFilterChange={onFilterChange}
        columns={columns}
        rows={rows}
        useAdvancedTable
        emptyMessage="No expenses found"
        actions={actions}
        selectable={false}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={data?.total || 0}
        onPageChange={setPage}
      />
    </PermissionGate>
  )
}
