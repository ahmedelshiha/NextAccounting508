# Admin Dashboard Templates & API Reference

This document explains how to use the StandardPage, ListPage, and AnalyticsPage templates, the AdvancedDataTable API, and the RealtimeProvider / useUnifiedData contracts. Use these guidelines when creating new admin pages or migrating legacy pages to the QuickBooks-style dashboard.

---

## StandardPage

Purpose: a consistent workspace container for admin pages that need a header, optional tabs, filters, search, and primary actions.

Props
- title: string — page title displayed in header
- subtitle?: string — optional subtitle or description
- actions?: React.ReactNode — primary CTA area (buttons, export controls)
- filters?: React.ReactNode — optional filter controls rendered in the header region
- children: React.ReactNode — main content (list/table/analytics)
- loading?: boolean — loading state; StandardPage shows header skeleton when true

Usage example

```
import StandardPage from '@/components/dashboard/templates/StandardPage'
import ServicesFilters from '@/components/dashboard/ServicesFilters'

export default function ServicesPage() {
  return (
    <StandardPage
      title="Services"
      subtitle="Manage services and pricing"
      actions={<PrimaryExportButtons />}
      filters={<ServicesFilters />}
    >
      <AdvancedDataTable ... />
    </StandardPage>
  )
}
```

Notes
- Keep the header actions minimal and explicitly imported. Avoid inline dynamic imports for primary UX actions.

---

## ListPage

Purpose: thin wrapper around StandardPage tuned for list/table workflows (search, pagination, bulk actions).

Props
- entityLabel: string — human readable entity name
- defaultPageSize?: number — page size default (20 recommended)
- table: React.ReactNode — the DataTable/AdvancedDataTable instance
- filters?: React.ReactNode

Usage example

```
import ListPage from '@/components/dashboard/templates/ListPage'

export default function BookingsList() {
  return (
    <ListPage entityLabel="Bookings" defaultPageSize={20} filters={<BookingsFilters />} table={<AdvancedDataTable .../>} />
  )
}
```

---

## AnalyticsPage

Purpose: KPI grid + charts layout for dashboard overview pages. Designed to host ProfessionalKPIGrid, RevenueTrendChart and small analytics widgets.

Props
- title?: string
- kpiGrid?: React.ReactNode
- charts?: React.ReactNode
- actions?: React.ReactNode

Usage example

```
import AnalyticsPage from '@/components/dashboard/templates/AnalyticsPage'

export default function AdminOverview() {
  return (
    <AnalyticsPage
      title="Overview"
      kpiGrid={<ProfessionalKPIGrid />}
      charts={<RevenueTrendChart />}
      actions={<RefreshAndExport />}
    />
  )
}
```

---

## AdvancedDataTable API

AdvancedDataTable is the unified table component used across admin pages. It provides consistent sorting, selection, pagination and export hooks.

Key props
- columns: TableColumn[] — column definitions (key, label, render?)
- data: any[] — row data
- total: number — total rows for pagination
- page: number
- pageSize: number
- onPageChange(page: number)
- onPageSizeChange(size: number)
- onSortChange({ sortBy: string, sortOrder: 'asc'|'desc' })
- onSelectionChange(selectedIds: string[])
- onExport?(opts) — hook for export actions
- emptyState?: React.ReactNode

Behavior
- Default pageSize is 20; components should not request more than 50 rows per page for performance.
- Emits selection events for BulkActionsPanel to consume.
- Renders sticky header and accessible table semantics (caption, aria-label, keyboard focus).

Example column definition

```
const columns = [
  { key: 'id', label: 'ID', render: (row) => row.id },
  { key: 'client', label: 'Client', render: (row) => row.clientName },
  { key: 'scheduledAt', label: 'Scheduled', render: (row) => new Date(row.scheduledAt).toLocaleString() }
]
```

---

## BulkActionsPanel

Use BulkActionsPanel alongside AdvancedDataTable. It receives selectedIds and exposes standard bulk actions (export, delete, change status). Bulk actions should call appropriate admin API endpoints and use toastFromResponse for consistent user feedback.

---

## RealtimeProvider & useUnifiedData

RealtimeProvider
- Establishes SSE (or fallback) subscriptions for admin realtime events.
- Exposes context for connection state and a way to register event handlers.
- Should be mounted in AdminProviders so all dashboard children can access it.

useUnifiedData
- Hook for list-style data fetching using SWR
- Accepts: path (string) and query params object { limit, offset, sortBy, sortOrder }
- Returns: { data, total, isLoading, error, refresh }
- Honors realtime events by revalidating when matching event topics arrive.

Contract example

```
const { data, total, isLoading, error, refresh } = useUnifiedData('/api/admin/bookings', { limit: 20, offset: 0, sortBy: 'scheduledAt', sortOrder: 'desc' })
```

---

## Error handling & toasts

- Use the centralized toast utilities in `src/lib/toast-api.ts`:
  - toastFromResponse(res, { failure: 'Failed to load' })
  - toastError(err, 'Something failed')
  - toastSuccess('Done')
- Server endpoints should surface machine-readable error bodies compatible with `makeErrorBody` in `src/lib/api/error-responses.ts` so the UI can show friendly messages via `getApiErrorMessage`.

---

## Migration checklist (how to migrate a legacy admin page)

1. Create a new page that imports StandardPage/ListPage/AnalyticsPage explicitly.
2. Move any inline styles into Tailwind utility classes and descriptive class names.
3. Replace legacy DataTable with AdvancedDataTable; wire selection → BulkActionsPanel.
4. Replace local toasts with toastFromResponse/toastError/toastSuccess.
5. Add Zod schemas for any new API routes and validate request/response shapes where applicable.
6. Add DOM-level tests for keyboard navigation and a11y (use existing test harness /renderDOM).
7. Add one smoke test that mounts the template with mocked API responses for quick verification.

---

## Next steps & recommended docs

- Add a short example repository snippet demonstrating a full booking list page (ListPage + AdvancedDataTable + BookingsFilters + BulkActionsPanel). This file can be a code sample in `docs/examples/booking-list.example.tsx`.
- Document AdvancedDataTable column typing in TypeScript and provide code snippets for custom cell renderers (status badges, action menus).
- Provide migration PR checklist for QA (visual diff checklist, keyboard-only walkthrough, perf smoke: route TTFB).

If you want, I will add the example snippet and TypeScript column typings in a follow-up commit.
