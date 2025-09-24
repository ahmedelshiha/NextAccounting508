# Admin Dashboard Templates & AdvancedDataTable — Usage Guide

This document explains how to use the standardized admin page templates and the AdvancedDataTable component.

## Templates

### StandardPage
- Purpose: Page shell with header, optional tabs, optional filters, and content area.
- Path: src/components/dashboard/templates/StandardPage.tsx
- Props:
  - title: string
  - subtitle?: string
  - primaryAction?: { label: string; onClick: () => void }
  - tabs?: Array<{ key: string; label: string }>
  - activeTab?: string
  - onTabChange?: (key: string) => void
  - filters?: ReactNode (usually <FilterBar />)
  - children: ReactNode

Usage:
```
<StandardPage
  title="Services"
  subtitle="Manage your service catalog"
  primaryAction={{ label: 'New', onClick: openNewServiceModal }}
>
  <ServicesList />
</StandardPage>
```

### ListPage
- Purpose: Convenience wrapper for lists/tables with built-in header/filters and actions.
- Path: src/components/dashboard/templates/ListPage.tsx
- Key Props:
  - title, subtitle, primaryAction
  - filters
  - columns, rows (if not supplying a custom child list)
  - useAdvancedTable?: boolean (default true via our pages)

Usage:
```
<ListPage
  title="Service Requests"
  filters={<TaskFiltersPanel />}
  useAdvancedTable
  columns={columns}
  rows={rows}
/>
```

### AnalyticsPage
- Purpose: KPI grid + charts layout used for /admin overview and analytics screens.
- Path: src/components/dashboard/templates/AnalyticsPage.tsx
- Slots:
  - header (title/subtitle/actions)
  - kpiArea (e.g., <ProfessionalKPIGrid />)
  - charts (stack any chart cards below)

## AdvancedDataTable
- Path: src/components/dashboard/tables/AdvancedDataTable.tsx
- Purpose: Sticky header, simple pagination, preserves visual style and selection for bulk actions.
- Generic: AdvancedDataTable<T extends { id?: string | number }>

Props:
- columns: Array<Column<T>>
- rows: T[]
- loading?: boolean
- selectable?: boolean
- onSelectionChange?: (ids: Array<string | number>) => void
- pageSize?: number (default 10)

Column<T> shape:
- key: keyof T | string
- label: string
- sortable?: boolean
- align?: 'left' | 'center' | 'right'
- render?: (value: T[keyof T], row: T) => ReactNode

Example:
```
const columns: Column<Service> = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'price', label: 'Price', align: 'right', render: v => Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v)) },
]

<AdvancedDataTable<Service>
  columns={columns}
  rows={services}
  selectable
  onSelectionChange={setSelectedIds}
/>
```

## Realtime + SWR
- RealtimeProvider (src/components/dashboard/realtime/RealtimeProvider.tsx) exposes subscribeByTypes.
- useUnifiedData (src/hooks/useUnifiedData.ts) provides revalidation on events and normalized keys via buildUnifiedPath.

Recommended pattern:
- Wrap admin pages in AdminProviders (src/components/admin/providers/AdminProviders.tsx).
- For lists, pass useAdvancedTable to ListPage or render AdvancedDataTable directly.
- For export actions, compute query from current filters and call API export endpoints.

## A11y & Styling
- Preserve existing style tokens and QuickBooks green accents.
- Use aria-current on active links (Sidebar handles this).
- Include aria-live regions for selection counts and filter summaries where relevant (see ServicesList).

## End-to-End Example: Services List with Realtime Refresh

Path references
- Template: src/components/dashboard/templates/ListPage.tsx
- Table: src/components/dashboard/tables/AdvancedDataTable.tsx
- Realtime: src/components/dashboard/realtime/RealtimeProvider.tsx (mounted via AdminProviders)
- Data hook: src/hooks/useUnifiedData.ts

Example usage in a page component (simplified from src/app/admin/services/page.tsx):
```
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, FilterConfig } from '@/types/dashboard'
import { useUnifiedData } from '@/hooks/useUnifiedData'

type ServiceRow = { id: string; name: string; price: number | null; status: string; updatedAt: string }

export default function ServicesPage() {
  const { data, isLoading, refresh } = useUnifiedData<{ services: ServiceRow[]; total: number }>({
    key: '/api/admin/services',
    params: { limit: 20, offset: 0, sortBy: 'updatedAt', sortOrder: 'desc' },
    events: ['service:created','service:updated','service:deleted'],
    parse: (json) => ({ rows: json.services, total: json.total }),
  })

  const columns: Column<ServiceRow>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'price', label: 'Price', align: 'right', render: (v) => v == null ? '—' : Intl.NumberFormat('en-US',{ style:'currency', currency:'USD' }).format(Number(v)) },
    { key: 'status', label: 'Status' },
  ]

  return (
    <ListPage<ServiceRow>
      title="Services"
      useAdvancedTable
      columns={columns}
      rows={data?.rows || []}
      total={data?.total}
      loading={isLoading}
      onRefresh={refresh}
    />
  )
}
```

Notes
- RealtimeProvider emits events consumed by useUnifiedData to revalidate the SWR cache automatically.
- The table defaults to pageSize=20 (≤ 50) for performance and accessibility.
- Preserve existing style tokens and QuickBooks green accents in headers, buttons, and pagination.

