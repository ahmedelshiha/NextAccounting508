import React from 'react'
import ListPage from '@/components/dashboard/templates/ListPage'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import BookingsFilters from '@/app/admin/bookings/components/BookingsFilters'
import BulkActionsPanel from '@/components/dashboard/tables/BulkActionsPanel'
import { useUnifiedData } from '@/hooks/useUnifiedData'

// Example column definitions and page wiring for a Bookings list page.
const columns = [
  { key: 'id', label: 'ID', render: (row: any) => row.id },
  { key: 'client', label: 'Client', render: (row: any) => row.client?.name || row.clientName },
  { key: 'service', label: 'Service', render: (row: any) => row.service?.title || row.serviceTitle },
  { key: 'scheduledAt', label: 'Scheduled', render: (row: any) => new Date(row.scheduledAt).toLocaleString() },
  { key: 'status', label: 'Status', render: (row: any) => <span className={`qb-badge-${row.status === 'CONFIRMED' ? 'success' : 'default'}`}>{row.status}</span> }
]

export default function BookingListExample() {
  // useUnifiedData handles SWR fetch + realtime revalidation
  const { data, total, isLoading, error, refresh, params, setParams } = useUnifiedData('/api/admin/bookings', { limit: 20, offset: 0, sortBy: 'scheduledAt', sortOrder: 'desc' })

  return (
    <ListPage
      entityLabel="Bookings"
      defaultPageSize={20}
      filters={<BookingsFilters params={params} onChange={setParams} />}
      table={(
        <AdvancedDataTable
          columns={columns}
          data={data?.bookings || []}
          total={total || 0}
          page={Math.floor((params?.offset || 0) / (params?.limit || 20)) + 1}
          pageSize={params?.limit || 20}
          onPageChange={(p) => setParams({ ...params, offset: ((p - 1) * (params?.limit || 20)) })}
          onPageSizeChange={(s) => setParams({ ...params, limit: s, offset: 0 })}
          onSortChange={({ sortBy, sortOrder }) => setParams({ ...params, sortBy, sortOrder })}
          onSelectionChange={(ids) => { /* pass to BulkActionsPanel via parent state */ }}
          emptyState={<div className="text-sm text-gray-500">No bookings found</div>}
        />
      )}
    >
      <BulkActionsPanel entity="bookings" />
    </ListPage>
  )
}
