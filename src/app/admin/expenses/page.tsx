"use client"

import React, { useMemo, useState } from 'react'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

interface ExpenseItem {
  id: string
  date: string
  category: 'software' | 'payroll' | 'rent' | 'utilities' | 'marketing' | 'travel' | 'other'
  vendor: string
  status: 'pending' | 'approved' | 'reimbursed' | 'rejected'
  amount: number
}

export default function AdminExpensesPage() {
  const [status, setStatus] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')

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
  ]

  const onFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatus(value)
    if (key === 'category') setCategory(value)
  }

  const columns: Column<ExpenseItem>[] = useMemo(() => ([
    { key: 'date', label: 'Date', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: true },
    { key: 'category', label: 'Category', sortable: true, render: (v) => String(v).replace('_',' ') },
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

  const rows: ExpenseItem[] = []

  const actions: RowAction<ExpenseItem>[] = [
    { label: 'View', onClick: (row) => { window.alert(`Open expense ${row.id}`) } },
  ]

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Expenses.</div>}>
      <ListPage<ExpenseItem>
        title="Expenses"
        subtitle="Track company expenses; use Reports for exports"
        secondaryActions={[{ label: 'Open Reports', onClick: () => { window.location.href = '/admin/reports' } }]}
        filters={filters}
        onFilterChange={onFilterChange}
        columns={columns}
        rows={rows}
        useAdvancedTable
        emptyMessage="No expenses found"
        actions={actions}
        selectable={false}
      />
    </PermissionGate>
  )
}
