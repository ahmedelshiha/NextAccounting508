export const bookingListExample = `
// Example: Booking List wiring (illustrative only)

import ListPage from '@/components/dashboard/templates/ListPage'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import BookingsFilters from '@/app/admin/bookings/components/BookingsFilters'
import BulkActionsPanel from '@/components/dashboard/tables/BulkActionsPanel'
import { useUnifiedData } from '@/hooks/useUnifiedData'

// This code is illustrative and stored as a docs string to avoid typechecking in the repo.

// Columns
const columns = [
  { key: 'id', label: 'ID', render: (row) => row.id },
  { key: 'client', label: 'Client', render: (row) => row.client?.name || row.clientName },
  { key: 'scheduledAt', label: 'Scheduled', render: (row) => new Date(row.scheduledAt).toLocaleString() }
]

// Use useUnifiedData to fetch and revalidate on realtime events
const { data, total, isLoading, refresh, params, setParams } = useUnifiedData('/api/admin/bookings', { limit: 20, offset: 0, sortBy: 'scheduledAt', sortOrder: 'desc' })

// Render
// <ListPage entityLabel="Bookings" filters={<BookingsFilters params={params} onChange={setParams} />} table={<AdvancedDataTable ... />}>
//   <BulkActionsPanel />
// </ListPage>
`;
