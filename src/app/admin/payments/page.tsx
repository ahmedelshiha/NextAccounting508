'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'

interface PaymentItem {
  id: string
  date: string
  client: string
  method: 'card' | 'bank_transfer' | 'cash' | 'check' | 'other'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  amount: number
}

import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { downloadExport } from '@/lib/admin-export'

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<PaymentsLoading />}>
      <PaymentsContent />
    </Suspense>
  )
}

function PaymentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<string>('all')
  const [method, setMethod] = useState<string>('all')
  const [range, setRange] = useState<string>('last_30')

  useEffect(() => {
    if (!searchParams) return

    const nextStatus = searchParams.get('status') ?? 'all'
    const nextMethod = searchParams.get('method') ?? 'all'
    const nextRange = searchParams.get('range') ?? 'last_30'

    setStatus((prev) => (prev === nextStatus ? prev : nextStatus))
    setMethod((prev) => (prev === nextMethod ? prev : nextMethod))
    setRange((prev) => (prev === nextRange ? prev : nextRange))
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (method && method !== 'all') params.set('method', method)
    if (range && range !== 'last_30') params.set('range', range)

    const qs = params.toString()
    const currentQs = searchParams?.toString() ?? ''
    if (qs === currentQs) return

    const href = qs ? `/admin/payments?${qs}` : '/admin/payments'
    router.replace(href)
  }, [status, method, range, router, searchParams])

  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', value: status, options: [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
      { value: 'refunded', label: 'Refunded' },
    ]},
    { key: 'method', label: 'Method', value: method, options: [
      { value: 'all', label: 'All' },
      { value: 'card', label: 'Card' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'cash', label: 'Cash' },
      { value: 'check', label: 'Check' },
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
    if (key === 'method') setMethod(value)
    if (key === 'range') setRange(value)
  }

  const columns: Column<PaymentItem>[] = useMemo(() => ([
    { key: 'date', label: 'Date', sortable: true },
    { key: 'client', label: 'Client', sortable: true },
    { key: 'method', label: 'Method', sortable: true, render: (v) => String(v).replace('_',' ') },
    { key: 'status', label: 'Status', sortable: true, render: (v) => (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        v === 'completed' ? 'bg-green-100 text-green-800' :
        v === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        v === 'failed' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>{String(v).toUpperCase()}</span>
    ) },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v: number) => `$${v.toFixed(2)}` },
  ]), [])

  const rows: PaymentItem[] = []

  const actions: RowAction<PaymentItem>[] = [
    { label: 'View', onClick: (row) => { window.alert(`Open payment ${row.id}`) } },
  ]

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Payments.</div>}>
      <ListPage<PaymentItem>
        title="Payments"
        subtitle="Monitor payment activity; use Reports for exports"
        secondaryActions={[{ label: 'Open Reports', onClick: () => { window.location.href = '/admin/reports' } }, { label: 'Export CSV', onClick: () => { downloadExport({ entity: 'payments', format: 'csv', status, method, range }) } }]}
        filters={filters}
        onFilterChange={onFilterChange}
        columns={columns}
        rows={rows}
        useAdvancedTable
        emptyMessage="No payments found"
        actions={actions}
        selectable={false}
      />
    </PermissionGate>
  )
}

function PaymentsLoading() {
  return (
    <div className="px-6 py-8 text-sm text-muted-foreground">Loading payments...</div>
  )
}
