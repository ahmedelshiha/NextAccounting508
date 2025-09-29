"use client"

import React, { useMemo, useState } from 'react'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

interface InvoiceItem {
  id: string
  date: string
  client: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
  amount: number
}

export default function AdminInvoicesPage() {
  const [status, setStatus] = useState<string>('all')
  const [range, setRange] = useState<string>('last_30')

  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', value: status, options: [
      { value: 'all', label: 'All' },
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
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

  const columns: Column<InvoiceItem>[] = useMemo(() => ([
    { key: 'date', label: 'Date', sortable: true },
    { key: 'client', label: 'Client', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (v) => (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        v === 'paid' ? 'bg-green-100 text-green-800' :
        v === 'overdue' ? 'bg-red-100 text-red-800' :
        v === 'sent' ? 'bg-blue-100 text-blue-800' :
        v === 'draft' ? 'bg-gray-100 text-gray-800' :
        'bg-gray-100 text-gray-800'
      }`}>{String(v).toUpperCase()}</span>
    ) },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v: number) => `$${v.toFixed(2)}` },
  ]), [])

  const rows: InvoiceItem[] = []

  const actions: RowAction<InvoiceItem>[] = [
    { label: 'View', onClick: (row) => { window.alert(`Open invoice ${row.id}`) } },
  ]

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Invoices.</div>}>
      <ListPage<InvoiceItem>
        title="Invoices"
        subtitle="Track invoices and statuses; use Reports for exports"
        secondaryActions={[
          { label: 'Open Reports', onClick: () => { window.location.href = '/admin/reports' } },
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
      />
    </PermissionGate>
  )
}
