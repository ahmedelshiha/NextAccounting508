Dashboard Analytics — New chart components

Summary

This document summarizes the new analytics chart components added to the admin dashboard and how to integrate them into the existing dashboard structure documentation:

New components

1. src/components/dashboard/analytics/ProfessionalKPIGrid.tsx
   - A reusable KPI grid exposing a small API: props { stats: { revenue, bookings, clients, tasks } }
   - Uses existing Card, Badge, Button primitives. Drill-down links use router.push to admin pages.

2. src/components/dashboard/analytics/BusinessIntelligence.tsx
   - Composes smaller chart wrappers and renders operational KPI blocks.
   - Fetches server analytics via /api/admin/analytics?range=30d (SWR) and falls back to dashboard prop values.
   - Imports: RevenueTrendChart, BookingFunnelChart.

3. src/components/dashboard/analytics/IntelligentActivityFeed.tsx
   - Extracted from src/app/admin/page.tsx to a reusable component.
   - Props: { data: DashboardData, thresholds?, history?, saveThresholds? }
   - Renders Schedule / Tasks / Deadlines tabs and keeps markup and ARIA unchanged.

4. src/components/dashboard/analytics/RevenueTrendChart.tsx
   - Line chart wrapper for monthly revenue trends with optional target overlay.
   - Props: { data?: { month: string; revenue: number; target?: number }[] }

5. src/components/dashboard/analytics/BookingFunnelChart.tsx
   - Horizontal bar chart for service booking distribution.
   - Props: { data?: { service: string; revenue?: number; percentage?: number; count?: number }[] }

Why these changes

- Separation of concerns: smaller focused components are easier to test, reuse, and maintain.
- Reuse: other admin pages can import the chart wrappers without copying logic.
- Accessibility: kept existing aria-live behaviours and control semantics from the original inline implementations.

How to integrate into dashboard-structure.md and quickbooks_dashboard_complete.md

Because I do not have read/write access to those files (ACL restriction), follow the steps below to update the authoritative docs.

1) Add component entries under the Analytics / Charts section:
   - ProfessionalKPIGrid — path, prop-types, usage example
   - BusinessIntelligence — path, dependencies (RevenueTrendChart, BookingFunnelChart)
   - IntelligentActivityFeed — path, props (data, thresholds, history, saveThresholds)
   - RevenueTrendChart — path, props and sample data shape
   - BookingFunnelChart — path, props and sample data shape

2) Provide code snippets (copy/paste from the repository) showing minimal usage. Example for BusinessIntelligence:

import BusinessIntelligence from '@/components/dashboard/analytics/BusinessIntelligence'

<BusinessIntelligence dashboard={dashboardData} />

3) Update the dashboard layout slots to reference the KPI/Chart components' slots and expected props. For example:
   - Overview slot: <AdminKPIGrid stats={dashboard.stats} />
   - Revenue slot: <BusinessIntelligence dashboard={dashboardData} />

4) Add notes about fallbacks and server/prop precedence (SWR result preferred, fallback to dashboard props).

5) Add a short subsection on testing: unit tests for RevenueTrendChart and BookingFunnelChart, and integration tests for BusinessIntelligence.

Files created/modified by this change

- Created: docs/dashboard-analytics-updates.md (this file)
- Created: src/components/dashboard/analytics/{ProfessionalKPIGrid,BusinessIntelligence,IntelligentActivityFeed,RevenueTrendChart,BookingFunnelChart}.tsx (implementation files)
- Updated: src/app/admin/page.tsx to import and use the extracted components

Next steps

- Manually sync the above entries into ./dashboard-structure.md and ./quickbooks_dashboard_complete.md (ACL prevented direct edits). I included integration instructions and usage snippets above to make the manual update copy/paste friendly.
- Add unit tests for RevenueTrendChart and BookingFunnelChart (suggest using Vitest and React Testing Library or snapshot tests for chart render outputs).
- Run pnpm lint, pnpm typecheck, and pnpm test:thresholds; fix any issues and address CI failures.

Contact

If you grant read/write access to dashboard-structure.md and quickbooks_dashboard_complete.md I can update them directly and create a PR with the changes. Otherwise, please paste the requested sections here and I will prepare exact patch content to paste into those files.
