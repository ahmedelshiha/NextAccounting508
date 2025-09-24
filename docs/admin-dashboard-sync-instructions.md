Admin Dashboard — Sync instructions for dashboard-structure.md and quickbooks_dashboard_complete.md

Purpose

These instructions show exactly what to add to the existing dashboard documentation so the new analytics components and chart wrappers are discoverable and documented.

Exact text blocks to insert

1) Under Analytics / Charts subsection (dashboard-structure.md)

### Analytics / Charts

- ProfessionalKPIGrid (src/components/dashboard/analytics/ProfessionalKPIGrid.tsx)
  - Props: { stats: { revenue, bookings, clients, tasks } }
  - Usage: <ProfessionalKPIGrid stats={dashboard.stats} />
  - Notes: Drill-down links navigate to admin list pages; component uses Card primitives and Badge/Button.

- BusinessIntelligence (src/components/dashboard/analytics/BusinessIntelligence.tsx)
  - Props: { dashboard }
  - Usage: <BusinessIntelligence dashboard={dashboardData} />
  - Composition: uses RevenueTrendChart and BookingFunnelChart; fetches /api/admin/analytics and falls back to dashboard props.

- IntelligentActivityFeed (src/components/dashboard/analytics/IntelligentActivityFeed.tsx)
  - Props: { data: DashboardData, thresholds?, history?, saveThresholds? }
  - Usage: <IntelligentActivityFeed data={dashboardData} thresholds={thresholds} history={history} saveThresholds={saveThresholds} />

- RevenueTrendChart (src/components/dashboard/analytics/RevenueTrendChart.tsx)
  - Props: { data?: { month: string; revenue: number; target?: number }[] }
  - Usage example:
    <RevenueTrendChart data={dashboard.revenueAnalytics.monthlyTrend} />

- BookingFunnelChart (src/components/dashboard/analytics/BookingFunnelChart.tsx)
  - Props: { data?: { service: string; revenue?: number; percentage?: number; count?: number }[] }
  - Usage example:
    <BookingFunnelChart data={dashboard.revenueAnalytics.serviceBreakdown} />

2) In quickbooks_dashboard_complete.md — add a short paragraph under "Charts & KPIs"

Charts & KPIs

- KPI Grid: uses ProfessionalKPIGrid (path + usage) and appears in the Overview tab.
- Revenue Trend: uses RevenueTrendChart in the Revenue tab; supports optional target line.
- Booking Funnel: uses BookingFunnelChart to show service distribution and counts; displayed as a horizontal bar chart.

3) Cross-reference guidance

- Add links in the components index to new files and add examples for the Admin layout slots showing where to make calls:
  - Overview: <ProfessionalKPIGrid stats={dashboard.stats} />
  - Overview => Activity: <IntelligentActivityFeed data={dashboardData} ... />
  - Revenue: <BusinessIntelligence dashboard={dashboardData} />

4) Testing notes

- Recommend unit tests for RevenueTrendChart and BookingFunnelChart using small sample datasets (10-20 points). For large CSV/export testing, keep existing integration tests that simulate 2k rows.

If you prefer, I can prepare exact patch-ready text snippets for those two files if you paste the target file sections here; otherwise, please grant ACL access and I will update them directly.
