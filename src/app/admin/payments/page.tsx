"use client"

import React, { useMemo, useState } from 'react'
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

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState<string>('all')
  const [method, setMethod] = useState<string>('all')

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
  ]

  const onFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatus(value)
    if (key === 'method') setMethod(value)
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
    <ListPage<PaymentItem>
      title="Payments"
      subtitle="Monitor payment activity; use Reports for exports"
      secondaryActions={[{ label: 'Open Reports', onClick: () => { window.location.href = '/admin/reports' } }]}
      filters={filters}
      onFilterChange={onFilterChange}
      columns={columns}
      rows={rows}
      useAdvancedTable
      emptyMessage="No payments found"
      actions={actions}
      selectable={false}
    />
  )
}
