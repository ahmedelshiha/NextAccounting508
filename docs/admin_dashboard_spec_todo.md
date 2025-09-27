# Admin Dashboard Implementation Plan — Dependency-Ordered TODO

Scope: Implement the QuickBooks-inspired professional admin dashboard defined in docs/admin_dashboard_spec.md, aligning with existing code under src/app/admin/** and components/**. Each task is specific, measurable, and outcome-oriented, with verification steps.

## 0) Discovery, Alignment, and Technical Baseline
- [ ] Read and annotate docs/admin_dashboard_spec.md to extract all modules, UI patterns, and contracts
  - Acceptance: A shared outline (this file) reflects all sections of the spec; no gaps.
  - Verify: Cross-check each spec section appears as tasks below.
- [ ] Inventory current admin code and templates for reuse
  - Paths: src/app/admin/**, components/admin/**, components/dashboard/**, components/dashboard/templates/**
  - Acceptance: Table mapping “spec module → existing pages/components/templates/APIs” produced in docs/admin_dashboard_spec_mapping.md
  - Verify: At least one reference mapped for every module with relevant code or “none yet”.
- [ ] Establish performance and UX baseline
  - Metrics: LCP ≤ 2.5s desktop, ≤ 4.0s mobile; FCP ≤ 1.8s; ALL admin pages TTI ≤ 3.5s; route data p95 ≤ 250ms
  - Acceptance: Baseline report stored in monitoring/performance-baseline.json updated with current values
  - Verify: Run vitest and lightweight profiling; document results.

## 1) Core Layout, Providers, and Navigation IA
- [ ] Standardize admin shell
  - Implement/confirm components: components/admin/layout/AdminHeader.tsx, AdminSidebar.tsx, AdminFooter.tsx, AdminErrorBoundary.tsx, ClientOnlyAdminLayout.tsx
  - Acceptance: All admin routes share a common shell (src/app/admin/layout.tsx) with fixed left sidebar, header, content area, footer
  - Verify: Visual check across /admin/* routes; layout snap tests.
- [ ] Wire global providers in admin context
  - Use components/dashboard/realtime/RealtimeProvider.tsx, components/admin/providers/AdminProviders.tsx, stores/adminLayoutStore*.ts
  - Acceptance: Realtime connection state available via context; permission and tenant state available globally
  - Verify: Unit tests confirming context values and fallback behavior when disconnected.
- [ ] Implement navigation information architecture (IA)
  - Sidebar sections and links exactly as in the spec’s “Navigation Architecture” with route targets under src/app/admin/**
  - Acceptance: Keyboard-nav friendly, active-route highlighting, collapsible groups, badges for counts (e.g., pending)
  - Verify: tests/dashboard/nav/sidebar-ia.test.tsx and tests/dashboard/nav/sidebar-keyboard.dom.test.tsx pass; manual tab/arrow navigation.

## 2) RBAC and Multi-Tenant Foundations
- [ ] Define permission matrix per module/action
  - Paths: src/app/admin/permissions/page.tsx, src/app/admin/roles/page.tsx, components/admin/permissions/**, lib/permissions.ts
  - Acceptance: CRUD actions gated via PermissionGate; unauthorized controls hidden; APIs enforce server-side checks
  - Verify: Unit tests deny and allow cases; snapshot UI differences by role.
- [ ] Tenant switcher and tenant-scoped data
  - Implement/confirm TenantSwitcher in AdminHeader; persist selected tenant; propagate tenantId in all admin fetchers
  - Acceptance: Switching tenant updates metrics, tables, and charts without reload; requests include tenant scope
  - Verify: Network inspection and unit tests asserting tenant header/query propagation.

## 3) Data Contracts and API Readiness
- [ ] Unify list/table contracts with AdvancedDataTable
  - Component: components/dashboard/tables/AdvancedDataTable.tsx
  - Acceptance: All list pages use columns, page, pageSize, total, sort, selection, export hooks; max 50 rows/page
  - Verify: Prop-type tests; pagination/sort/selection unit tests.
- [ ] Realtime event contracts
  - Ensure RealtimeProvider emits typed events for bookings, tasks, service-requests, services, users, invoices
  - Acceptance: Subscription handlers update UI widgets without full page reload
  - Verify: Simulated SSE messages update counts and rows.
- [ ] Work Orders data model and endpoints (new module)
  - Schema: prisma/schema.prisma; API: src/app/api/admin/work-orders/**
  - Entities: WorkOrder, WorkOrderService, WorkOrderTimeline, WorkOrderAttachment
  - Acceptance: CRUD + status transitions + analytics endpoints; migrations created under prisma/migrations/**
  - Verify: Integration tests for CRUD, transitions, and analytics aggregations.

## 4) Dashboard Overview Page (KPI → Charts → Activity)
- [ ] Implement DashboardOverview page with KPI cards row
  - Use components/dashboard/analytics/ProfessionalKPIGrid.tsx and MetricCard pattern from spec
  - Metrics: Active Work Orders, Pending Bookings, Revenue (MTD), Team Utilization
  - Acceptance: KPIs load under 400ms with skeletons; each card supports “View Details”, “Export Data”, “Configure Alert” actions
  - Verify: Unit tests for rendering and actions; mocked data path.
- [ ] Charts row: Work Order Trends (line), Revenue by Service (donut)
  - Use components/admin/services/RevenueTimeSeriesChart.tsx and chart widgets
  - Acceptance: Timeframe switch (7d/30d/90d) and legend toggle; export PNG/CSV hooks
  - Verify: Chart rendering tests; interaction tests for timeframe change.
- [ ] Activity row: ActivityFeed, UpcomingTasks, RecentBookings
  - Use components/dashboard/analytics/IntelligentActivityFeed.tsx and bookings/tasks widgets
  - Acceptance: Realtime updates; “mark as read” and quick actions
  - Verify: Event-driven list updates; unit tests for quick actions.

## 5) Work Orders Module (New)
- [ ] List page with search, filters, status tabs, bulk actions
  - Route: src/app/admin/work-orders/page.tsx
  - Acceptance: Server-paginated table (AdvancedDataTable), filter chips persisted in URL, bulk export/delete/status change
  - Verify: URL query sync tests; bulk action result toasts.
- [ ] Details page with tabs: overview, services, tasks, timeline, attachments
  - Route: src/app/admin/work-orders/[id]/page.tsx
  - Acceptance: Each tab lazy-loads, timeline shows chronological events, attachments preview and AV-scan status
  - Verify: Tab routing tests; attachment preview and quarantine indicators.
- [ ] Create/edit flows
  - Route: src/app/admin/work-orders/new/page.tsx
  - Acceptance: Validation rules enforced; duplicate from existing; autosave drafts every 10s
  - Verify: Form validation tests; autosave debounce test.
- [ ] Analytics
  - Route: src/app/admin/work-orders/analytics/page.tsx
  - Acceptance: Trend charts and conversion funnel
  - Verify: Chart data correctness with fixtures.

## 6) Bookings and Calendar Management
- [ ] Enhance bookings list with “Today”, calendar view, availability slots, recurring bookings
  - Routes: src/app/admin/bookings/page.tsx, src/app/admin/calendar/page.tsx, src/app/admin/availability/page.tsx
  - Acceptance: Calendar grid supports click-to-create, drag-to-reschedule; availability toggle; recurring preview
  - Verify: Interaction tests; recurring preview API returns deterministic result.

## 7) Service Requests Management
- [ ] List + filters sidebar + bulk actions
  - Route: src/app/admin/service-requests/page.tsx
  - Acceptance: Filter panel with saved views; bulk approve/reject/convert
  - Verify: Bulk operations call APIs under src/app/api/admin/service-requests/** and show toasts.
- [ ] Review panel with decision actions and pricing estimator
  - Route: src/app/admin/service-requests/[id]/page.tsx
  - Acceptance: Approve/Request Info/Reject; display customer and estimated price; conversion to booking
  - Verify: Status transitions and conversion tests.

## 8) Tasks Management
- [ ] Views: Board, List, Table, Calendar, Gantt (existing components under src/app/admin/tasks/components/**)
  - Route: src/app/admin/tasks/page.tsx + subviews
  - Acceptance: Drag across columns; filters saved per user; templates; bulk operations
  - Verify: Existing tests in src/app/admin/tasks/tests/** pass and extended for board interactions.

## 9) Services Module
- [ ] Catalog, categories, pricing management, analytics
  - Routes: src/app/admin/services/page.tsx, src/app/admin/services/list/page.tsx
  - Acceptance: Slug check API, versions, conversions table, revenue chart
  - Verify: API calls under src/app/api/admin/services/** including slug-check, versions, stats.

## 10) Financial Module
- [ ] Invoices, payments, expenses, taxes, invoice sequences
  - Routes: src/app/admin/invoices/page.tsx, src/app/admin/invoices/sequences/page.tsx, src/app/admin/payments/page.tsx, src/app/admin/expenses/page.tsx, src/app/admin/taxes/page.tsx
  - Acceptance: FinancialMetrics header, invoice templates, payment reminders, export center
  - Verify: Data consistency across invoices/payments; currency formatting via settings.

## 11) Team Management and Permissions
- [ ] Staff directory, roles & permissions, performance, workload, skills, availability
  - Routes: src/app/admin/team/page.tsx, src/app/admin/permissions/page.tsx, src/app/admin/roles/page.tsx
  - Acceptance: Role editor persists matrix; workload chart renders from team analytics
  - Verify: Permission changes reflect immediately; chart data tests with fixtures.

## 12) Analytics & Reports
- [ ] Business Intelligence and Performance Metrics pages
  - Routes: src/app/admin/analytics/page.tsx, src/app/admin/reports/page.tsx
  - Acceptance: Uses components/dashboard/templates/AnalyticsPage.tsx with KPI grid and charts; export scheduling
  - Verify: Export jobs created via admin API; file download link available.

## 13) Communications
- [ ] Notifications, chat console, email templates, newsletter
  - Routes: src/app/admin/notifications/page.tsx, src/app/admin/chat/page.tsx, src/app/admin/newsletter/page.tsx
  - Acceptance: Real-time notifications; email template preview; newsletter send test mode
  - Verify: SSE updates; preview renders MJML/HTML; audit log entries created.

## 14) System Management
- [ ] Settings hub
  - Routes: src/app/admin/settings/page.tsx, src/app/admin/settings/booking/page.tsx, src/app/admin/settings/currencies/page.tsx
  - Acceptance: SettingsPanel layout with sidebar nav; forms validated (company info, timezone, currencies, booking rules, payment settings)
  - Verify: Form schema tests using zod; optimistic save + rollback on error.
- [ ] Upload quarantine and system health
  - Routes: src/app/admin/uploads/quarantine/page.tsx, src/app/admin/perf-metrics/page.tsx, src/app/admin/security/page.tsx, src/app/admin/compliance/page.tsx
  - Acceptance: Quarantine shows AV status & release/delete; health shows uptime/latency/error rates
  - Verify: AV callback status from src/app/api/uploads/av-callback/**; health endpoints return OK.

## 15) Search, Filters, and Export/Import
- [ ] Unified search and filter controls across modules
  - Acceptance: Debounced search; filter chips with URL sync; saved views per user
  - Verify: URL reflects filters; restoring URL restores state.
- [ ] Export/import everywhere
  - Acceptance: CSV/JSON exports constrained by current filters; import flows validate schema and show row-level errors
  - Verify: Export invokes onExport from AdvancedDataTable; import dry-run and apply steps tested.

## 16) Accessibility and UX Standards
- [ ] Keyboard navigation and ARIA labeling
  - Acceptance: All interactive controls reachable via Tab/Shift+Tab; escape to close menus; ARIA roles on tables, tabs, dialogs
  - Verify: axe checks pass; snapshots include aria-* attributes.
- [ ] Consistent design tokens and components
  - Acceptance: Use existing tokens (e.g., var(--primary-600)) and card/button/form patterns from the spec and components/ui/**; no inline styles
  - Verify: Visual QA ensures consistency of spacing, radii, typography scale.

## 17) Responsive Design
- [ ] Breakpoints and adaptive layouts
  - Acceptance: Sidebar collapses < 1024px; charts stack; tables scroll within container; mobile headers condense actions
  - Verify: Viewport tests (360px, 768px, 1024px, 1440px) via Playwright; no content overflow.

## 18) Performance and Reliability
- [ ] Data-access and caching
  - Acceptance: SWR/react query patterns for caching; avoid N+1; pagination limits respected (≤ 50 rows/page)
  - Verify: p95 API latency ≤ 250ms for list endpoints under typical load.
- [ ] Code-splitting, virtualization, and skeletons
  - Acceptance: Heavy tabs/components lazy-loaded; tables virtualized for 1k+ rows; skeletons under 150ms
  - Verify: Bundle analyzer shows reduced async chunks; scroll performance 60fps threshold passes.

## 19) Observability, Auditing, and Security
- [ ] Audit trail
  - Acceptance: CRUD and status transitions emit audit events; admin/audit logs page lists entries with filters
  - Verify: Create-update-delete actions produce entries; filters by actor/date/module.
- [ ] Error monitoring and health checks
  - Acceptance: @sentry/nextjs initialized; health endpoints wired to monitoring; error boundary catches render failures
  - Verify: Simulate errors to see captured events; health history page returns recent status.
- [ ] Security policies
  - Acceptance: All admin routes protected by middleware; sensitive actions require confirmation; file uploads AV-scanned
  - Verify: Middleware tests; AV positive cases quarantined.

## 20) Page Template Adoption
- [ ] Migrate pages to templates per docs/admin-dashboard-templates-and-api.md
  - Use StandardPage, ListPage, AnalyticsPage consistently
  - Acceptance: Pages expose title, actions, filters; tables use AdvancedDataTable; BulkActionsPanel integrated
  - Verify: Smoke tests across services, bookings, tasks, and reports pages.

## 21) Testing Strategy (Unit, Integration, E2E)
- [ ] Extend unit tests
  - Targets: AdminSidebar, AdminHeader, KPI grid, tables, forms, filters, dialogs
  - Acceptance: Coverage ≥ 80% lines/branches in admin-related code
  - Verify: pnpm test thresholds pass tests/thresholds.test.ts.
- [ ] Integration tests
  - Acceptance: List → details → edit roundtrip; bulk actions; export; tenant switch; role-gated controls
  - Verify: vitest integration suite green under tests/integration/**.
- [ ] E2E flows
  - Acceptance: Playwright covers login, navigation, dashboard load, search/filter, CRUD, export
  - Verify: e2e/run-e2e.sh passes in CI; flake rate < 2% over 20 runs.

## 22) Rollout and Documentation
- [ ] Feature flag phased rollout
  - Acceptance: Admin dashboard behind an env flag for beta users; ability to revert quickly
  - Verify: Toggling flag switches to simplified page-simple.tsx vs full page.tsx.
- [ ] Documentation updates
  - Acceptance: Developer setup and module READMEs in docs/** updated; screenshots for key pages
  - Verify: PR review checklist includes documentation confirmation.

---

## Acceptance Summary and Metrics
- UX: LCP ≤ 2.5s desktop, ≤ 4.0s mobile; navigation keyboard-accessible; consistent styling
- Data: p95 list API ≤ 250ms; export time for 10k rows ≤ 5s (background job)
- Realtime: KPI and counts update within ≤ 2s of event
- Reliability: No uncaught exceptions in Sentry smoke test; health checks green for 24h
- Compliance: All admin routes RBAC enforced and tenant-scoped; audit logs present for privileged actions

## Suggested Verification Checklist (per module)
- [ ] Navigation to page works and highlights active route
- [ ] Server-paginated table loads with filters and exports correctly
- [ ] Detail view tabs render and lazy-load data
- [ ] Actions respect permissions and emit audit entries
- [ ] Realtime updates reflect changes without refresh
- [ ] Mobile layout renders without overflow or hidden content
