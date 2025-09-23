"use client"

import { useMemo, useState } from 'react'
import { useBookings, type BookingsQuery } from '@/hooks/useBookings'
import FilterBar from '@/components/dashboard/FilterBar'
import DataTable from '@/components/dashboard/DataTable'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'
import Link from 'next/link'

interface SRItem {
  id: string
  clientName?: string | null
  client?: { name?: string | null; email?: string | null } | null
  service?: { name?: string | null; price?: unknown } | null
  status?: string | null
  priority?: string | null
  bookingType?: string | null
  scheduledAt?: string | Date | null
}

export default function BookingsList() {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<{
    status?: string
    priority?: string
    bookingType?: string
    paymentStatus?: string
  }>({})

  const params: BookingsQuery = {
    scope: 'admin',
    q,
    status: filters.status || 'ALL',
    priority: filters.priority || 'ALL',
    bookingType: filters.bookingType as any || 'ALL',
    paymentStatus: filters.paymentStatus as any || 'ALL',
    page: 1,
    limit: 20,
  }

  const { items, isLoading, refresh } = useBookings(params)

  const onFilterChange = (key: string, value: string) => {
    setFilters((p) => ({ ...p, [key]: value || undefined }))
  }

  const active = useMemo(() => {
    const a: Array<{ key: string; label: string; value: string }> = []
    if (q) a.push({ key: 'q', label: 'Search', value: q })
    if (filters.status) a.push({ key: 'status', label: 'Status', value: filters.status })
    if (filters.priority) a.push({ key: 'priority', label: 'Priority', value: filters.priority })
    if (filters.bookingType) a.push({ key: 'bookingType', label: 'Type', value: filters.bookingType })
    if (filters.paymentStatus) a.push({ key: 'paymentStatus', label: 'Payment', value: filters.paymentStatus })
    return a
  }, [q, filters])

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'CONFIRMED', label: 'Confirmed' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'NO_SHOW', label: 'No Show' },
    ], value: filters.status },
    { key: 'priority', label: 'Priority', options: [
      { value: 'LOW', label: 'Low' },
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'High' },
      { value: 'URGENT', label: 'Urgent' },
    ], value: filters.priority },
    { key: 'bookingType', label: 'Type', options: [
      { value: 'STANDARD', label: 'Standard' },
      { value: 'RECURRING', label: 'Recurring' },
      { value: 'EMERGENCY', label: 'Emergency' },
      { value: 'CONSULTATION', label: 'Consultation' },
    ], value: filters.bookingType },
    { key: 'paymentStatus', label: 'Payment', options: [
      { value: 'UNPAID', label: 'Unpaid' },
      { value: 'INTENT', label: 'Intent' },
      { value: 'PAID', label: 'Paid' },
      { value: 'FAILED', label: 'Failed' },
      { value: 'REFUNDED', label: 'Refunded' },
    ], value: filters.paymentStatus },
  ]

  const columns: Column<SRItem>[] = [
    { key: 'clientName', label: 'Client', sortable: true, render: (_, r) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{r.clientName || r.client?.name || '—'}</span>
        <span className="text-xs text-gray-500">{r.client?.email || '—'}</span>
      </div>
    ) },
    { key: 'service', label: 'Service', render: (v) => (
      <div className="flex flex-col">
        <span>{(v?.name as string) || '—'}</span>
      </div>
    ) },
    { key: 'scheduledAt', label: 'Date', sortable: true, render: (v) => (
      <span>{v ? new Date(v).toLocaleString() : '—'}</span>
    ) },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'priority', label: 'Priority' },
    { key: 'bookingType', label: 'Type' },
  ]

  const actions: RowAction<SRItem>[] = [
    { label: 'Open', onClick: (row) => { window.location.href = `/admin/service-requests/${row.id}` } },
  ]

  const [sortBy, setSortBy] = useState<string | undefined>('scheduledAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    const arr = [...(items as SRItem[])]
    if (!sortBy) return arr
    arr.sort((a, b) => {
      const av = (a as any)[sortBy]
      const bv = (b as any)[sortBy]
      const ax = av == null ? '' : String(av)
      const bx = bv == null ? '' : String(bv)
      if (sortBy === 'scheduledAt') {
        const ad = av ? new Date(av).getTime() : 0
        const bd = bv ? new Date(bv).getTime() : 0
        return (ad - bd) * (sortOrder === 'asc' ? 1 : -1)
      }
      return ax.localeCompare(bx) * (sortOrder === 'asc' ? 1 : -1)
    })
    return arr
  }, [items, sortBy, sortOrder])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Service Requests & Appointments</h2>
        <Link href="/admin/service-requests/new" className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">New</Link>
      </div>
      <FilterBar
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        onSearch={(v) => setQ(v)}
        active={active}
        searchPlaceholder="Search clients, services…"
      />
      <DataTable
        columns={columns}
        rows={sorted}
        loading={isLoading}
        onSort={(key) => {
          if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
          setSortBy(key)
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        actions={actions}
        selectable
        onSelectionChange={() => { /* selection available for future batch actions */ }}
      />
    </div>
  )
}
