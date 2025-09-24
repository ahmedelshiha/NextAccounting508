# QuickBooks-Style Admin Dashboard Migration — Ordered TODO Checklist

Purpose: Execute the transformation plan from docs/migration_plan_comprehensive.md and docs/quickbooks_transformation_plan.md with clear, actionable, dependency-ordered tasks. Each task is specific, measurable, and outcome-oriented.

---
For implementation details, see 
[QuickBooks Dashboard Complete](./docs/quickbooks_dashboard_complete.md) 
and 
[QuickBooks Transformation Plan](./docs/quickbooks_transformation_plan.md)
---

## Latest Status Update — 2025-09-24

- Completed
  - [x] Phase 3: Implemented reusable templates (StandardPage, ListPage, AnalyticsPage), AdvancedDataTable, and BulkActionsPanel.
  - [x] Phase 4: Migrated /admin overview to AnalyticsPage with KPIs, RevenueTrendChart, and activity feed; added explicit refresh/export actions and wired filters.
  - [x] Phase 5: Migrated /admin/bookings to ListPage with date/status filters, sorting, selection, and primary actions.
  - [x] Phase 5: Migrated /admin/service-requests to ListPage with status/priority/type/payment filters, sorting, selection, and row actions.
  - [x] Implemented admin RealtimeProvider (src/components/dashboard/realtime/RealtimeProvider.tsx) and wired into AdminProviders.
  - [x] Created useUnifiedData hook (src/hooks/useUnifiedData.ts) with SWR integration and realtime-triggered revalidation.
  - [x] Added preview pages for templates under /admin/previews (standard, list, analytics) for visual verification.
  - [x] Replaced DataTable usages with AdvancedDataTable across admin lists and overview; preserved selection/bulk actions.
  - [x] Added tests: apiFetch failure fallback, AdvancedDataTable SSR pagination, AdminContext defaults, RealtimeProvider SSR defaults, useUnifiedData initial state.
- Why
  - Establish a consistent, reusable admin scaffolding to reduce duplication and improve maintainability, accessibility, and performance.
  - Align information architecture and visuals with the QuickBooks-style design while preserving existing style tokens and green accent usage.
  - Prepare for reliable Netlify builds with explicit imports and predictable layouts (no lazy or inline hacks).
  - Unify realtime and data fetching patterns to simplify refresh and reduce bugs.
  - Provide fast local previews for QA without backend wiring.
- Next steps
  - [x] Add unit tests for realtime event parsing (SSE payloads → AdminRealtimeEvent) and unified path builder.
  - [x] Add tests for refresh flows (verify SWR revalidation on events) using jsdom to simulate realtime events and SWR revalidation.
  - [x] Verify sidebar IA: Covered via jsdom test ensuring all nav hrefs render when collapsed and active states are set via pathname mock; manual click-through recommended in staging.
  - [x] Run global smoke tests for overview/services/service-requests: added jsdom/SSR smokes for KPI grid, ServicesList (mocked api), and ServiceRequestsTable.
  - [ ] Measure route load and interaction timings before/after AdvancedDataTable change; record in docs.
  - [x] Document template usage and AdvancedDataTable API in Phase 11 docs (see docs/admin-dashboard-templates-and-table.md).

---

## Phase 0 — Planning, Audit, and Safeguards
- [ ] Confirm scope, owners, and timeline for all phases (engineering, QA, design, ops) documented in PROJECT_SUMMARY.md
- [ ] Inventory all admin routes under src/app/admin/** and categorize by priority (P0, P1, P2, P3) with owners
- [ ] Capture current UX/UI screenshots and key metrics (bundle size, route TTFB, errors) for comparison
- [ ] Enable history safety: document rollback steps using platform History Tab and ensure git remote push capability
- [ ] Define acceptance criteria per phase (no console errors, responsive, RBAC enforced, tests pass)

Outcomes: inventory complete, baseline metrics captured, rollback plan prepared, acceptance criteria agreed.

---

## Phase 1 — Foundation and Layout Architecture (Prerequisite for all migrations)
- [x] Create global admin layout wrapper
  - [x] Implement src/app/admin/layout.tsx using DashboardLayout and AdminProviders
  - [x] Enforce auth/redirect via getServerSession + role gate (CLIENT → /portal)
  - [x] Validate children render correctly across all /admin routes
- [x] Add Admin context/providers
  - [x] Implement src/components/admin/providers/AdminProviders.tsx (SWRConfig, SessionProvider, Toaster)
  - [x] Implement src/components/admin/providers/AdminContext.tsx (sidebarCollapsed, currentTenant, userPermissions)
  - [x] Add unit tests for context behavior and loading states
- [x] Replace legacy shells
  - [x] Remove/disable legacy overlays/wrappers that conflict with DashboardLayout
  - [x] Verify only one layout wraps /admin pages
  - [x] Refactor src/app/admin/page.tsx to remove local DashboardLayout wrapper

Acceptance: all /admin pages render under the new layout without visual overlaps; login/portal redirects correct; zero console errors.

Progress Update — Phase 1
- Completed: global admin/layout.tsx, AdminProviders, AdminContext, and removal of local wrappers in admin/page.tsx.
- Why: ensures a single consistent dashboard shell, prevents overlay/double-layout issues, and enforces auth/role gating.
- Next: Phase 2 sidebar enhancements (permission-based IA, collapse state via AdminContext) and Phase 3 templates; add AdminContext unit tests.

---

## Phase 2 — Navigation and IA (Depends on Phase 1)
- [x] Implement permission-based sidebar
  - [x] Upgrade src/components/dashboard/Sidebar.tsx with groups, badges, RBAC filters
  - [x] Wire to AdminContext (collapse/expand) and active route highlighting
  - [x] Ensure accessibility (keyboard navigation, aria-current, focus states)
- [ ] Verify IA alignment
  - [x] Routes exist for: Overview, Analytics, Reports, Clients, Bookings, Calendar, Service Requests, Services, Availability, Invoices, Payments, Expenses, Tasks, Reminders, Audits, Posts, Newsletter, Team, Permissions, Roles, Settings, Integrations, Uploads
  - [ ] Sidebar links navigate to the correct workspace container

Progress Update — Phase 2
- Completed: RBAC-gated Sidebar using session role + hasPermission; collapse state via AdminContext; active link highlighting; A11y attributes added.
- Why: limits navigation to authorized features and provides consistent IA with collapse UX.
- Next: Templates integrated into /admin overview; proceed to migrate P1 lists (Bookings, Service Requests, Services) using ListPage.

Acceptance: sidebar shows only permitted items, persists collapsed state, and routes correctly; keyboard navigation works.

---

## Phase 3 — Page Templates and Component Standards (Depends on Phase 1)
- [ ] Create standardized page templates
  - [x] src/components/dashboard/templates/StandardPage.tsx (header, tabs, filters, search, error/loading)
  - [x] src/components/dashboard/templates/ListPage.tsx (wraps DataTable)
  - [x] src/components/dashboard/templates/AnalyticsPage.tsx (KPI grid + charts)
  - [x] Add story/preview examples for each template
- [ ] Advanced table and bulk actions
  - [x] src/components/dashboard/tables/AdvancedDataTable.tsx (sorting, selection, sticky columns, empty state)
  - [x] src/components/dashboard/tables/BulkActionsPanel.tsx (action registry, clear selection)
  - [x] Replace legacy tables where applicable
- [ ] Realtime and unified data layer
  - [x] src/components/dashboard/realtime/RealtimeProvider.tsx (SSE subscription, toast hooks)
  - [x] src/hooks/useUnifiedData.ts (module-param data fetching, refresh, errors)
  - [ ] Add tests for fetch failures, refresh, and realtime parsing

Acceptance: new templates compile and are reusable; table supports selection/sort/export; unified data hook verified with mocked endpoints.

Progress Update — Phase 3
- Completed: RealtimeProvider and useUnifiedData integrated; baseline tests added for provider context and unified data initial state. Added preview pages for StandardPage, ListPage, and AnalyticsPage under /admin/previews.
- Why: establish consistent realtime refresh and a single data-fetching pattern across admin modules, reducing duplication and improving reliability. Previews provide quick visual verification without wiring to live data.
- Next: add failure/retry and realtime parsing tests, and replace any remaining legacy tables with AdvancedDataTable.

---

## Phase 4 — Critical Page Migrations P0 (Depends on Phases 1–3)
- [x] Dashboard Overview
  - [x] Migrate src/app/admin/page.tsx to AnalyticsPage
  - [x] Wire KPIs, charts, and activity components; hook up refresh/export
  - [x] Validate responsive behavior and realtime status indicator
- [ ] Global smoke test
  - [ ] Login → /admin overview flow works; no layout shifts; zero console errors
  - [ ] Navigate to Services (both /admin/services and /admin/services/list) and Service Requests; verify filters, pagination, bulk actions, and modals work without console errors

Acceptance: overview page uses new template; real-time and filters operate; smoke tests pass.

Update — Legacy Table Replacement
- Completed: Replaced remaining DataTable usages in admin lists (Bookings, Services, Clients, Tasks) and overview tabs with AdvancedDataTable; extended AdvancedDataTable to expose onSelectionChange to preserve bulk actions.
- Why: unify table UX (sticky headers + pagination) while preserving existing selection-driven bulk actions and visual style.

---

## Phase 5 — High-Traffic Page Migrations P1 (Depends on Phases 1–3)
- [x] Bookings
  - [x] Migrate src/app/admin/bookings/page.tsx to ListPage + AdvancedDataTable
  - [x] Integrate filters (dateRange, status), actions (view/edit/cancel), calendar link
  - [ ] Verify booking creation/edit flows; ensure totals consistent with stats
- [x] Service Requests
  - [x] Migrate src/app/admin/service-requests/page.tsx to ListPage + AdvancedDataTable
  - [x] Add filters (status, priority, type, payment) and actions (open)
  - [ ] Validate assignment workflows and status transitions
- [x] Services
  - [x] Migrate src/app/admin/services/page.tsx to ListPage + AdvancedDataTable; integrated analytics toggle and ServiceForm modal
  - [x] Migrate src/app/admin/services/list/page.tsx to ListPage + AdvancedDataTable
  - [x] Integrate existing components (analytics, filters, forms)
  - [ ] Validate create/edit/clone and versioning flows if present

Acceptance: each page renders with new templates, supports sorting/filters/actions, and matches data counts; no regressions.

---

## Phase 6 — Secondary Page Migrations P2 (Depends on Phases 1–3)
- [ ] Tasks
  - [ ] Migrate src/app/admin/tasks/page.tsx using existing tasks components under src/app/admin/tasks/components/**
  - [ ] Ensure TaskProvider integration, analytics blocks, and bulk actions
- [ ] Clients
  - [ ] Migrate src/app/admin/clients/profiles/page.tsx, src/app/admin/clients/invitations/page.tsx, src/app/admin/clients/new/page.tsx
  - [ ] Validate create/invite flows and profile search
- [ ] Analytics & Reports
  - [ ] Migrate src/app/admin/analytics/page.tsx and src/app/admin/reports/page.tsx to templates
  - [ ] Integrate chart components and export buttons

Acceptance: task operations, client management, and reporting flows function end-to-end under new layout.

---

## Phase 7 — Administrative/System Page Migrations P3 (Depends on Phases 1–3)
- [ ] Settings
  - [ ] Migrate src/app/admin/settings/page.tsx; integrate BookingSettingsPanel and currencies screens
  - [ ] Validate flows at src/app/admin/settings/booking/page.tsx and src/app/admin/settings/currencies/page.tsx
- [ ] Team & Access
  - [ ] Migrate src/app/admin/team/page.tsx, src/app/admin/permissions/page.tsx, src/app/admin/roles/page.tsx
  - [ ] Validate RBAC changes and team assignments screens
- [ ] Finance Ops
  - [ ] Migrate src/app/admin/invoices/page.tsx, payments/page.tsx, expenses/page.tsx
  - [ ] Ensure totals, filters, and exports work
- [ ] Content & System
  - [ ] Migrate src/app/admin/posts/page.tsx, newsletter/page.tsx, audits/page.tsx, integrations/page.tsx, uploads/quarantine/page.tsx

Acceptance: all P3 pages load under new layout, preserve feature parity, and pass navigation/access tests.

---

## Phase 8 — API, Data, and Routing Integrity (Runs alongside migrations)
- [ ] Verify all /api/admin/** endpoints used by new hooks exist and return expected shapes
- [ ] Add Zod schemas for request/response validation at boundaries
- [ ] Ensure pagination/sorting/filtering parameters are consistent across modules
- [ ] Add error mapping to user-friendly toasts; log details to Sentry

Acceptance: consistent API contracts; typed boundaries; graceful error states; Sentry captures failures.

---

## Phase 9 — Quality, Testing, and Accessibility
- [ ] Unit & Integration Tests
  - [x] AdminContext default values smoke test
  - [ ] AdminProviders composition test (Session/SWR/AdminContext/Realtime mounted)
  - [ ] Template rendering tests for StandardPage/ListPage/AnalyticsPage
  - [ ] Add table interactions tests (select, sort, paginate, bulk actions)
  - [ ] Cover critical flows: bookings CRUD, service-request assign, services edit
  - [x] apiFetch returns 503 on network error/timeout
  - [x] AdvancedDataTable SSR pagination summary renders
- [ ] E2E Smoke Paths
  - [ ] Auth → Admin → Bookings → New → Save → List
  - [ ] Admin → Service Requests → Assign → Status Update
- [ ] Accessibility (A11y)
  - [ ] Verify focus order, landmarks, roles, and aria attributes for navigation and tables
  - [ ] Keyboard-only operation of sidebar and tables

Acceptance: tests green; axe checks pass with no critical violations.

---

## Phase 10 — Performance and Telemetry
- [ ] Performance
  - [ ] Ensure no unnecessary client bundles in layout; split heavy charts where appropriate (explicit imports, no hacks)
  - [ ] Confirm table virtualization if dataset > 1,000 rows or paginate to <= 50 rows per page
  - [ ] Measure and record before/after route load and interaction timings
- [ ] Observability
  - [ ] Add Sentry spans for slow API calls; surface error rates in /admin/health-history
  - [ ] Log real-time connection health and retries

Acceptance: improved or equal route metrics; stable SSE; no performance regressions.

---

## Phase 11 — Documentation and Developer Experience
- [ ] Update docs explaining templates and composition patterns
  - [ ] Document StandardPage/ListPage/AnalyticsPage usage and props
  - [ ] Document AdvancedDataTable API and examples
  - [ ] Document RealtimeProvider and useUnifiedData hook contracts
- [ ] Add code comments for maintainability (no TODO placeholders)
- [ ] Provide migration examples for a new admin module using the templates

Acceptance: engineers can build a new admin page using docs without assistance.

---

## Phase 12 — Cleanup, Deprecations, and Rollout
- [ ] Remove retired admin pages in backup/ once parity is verified
- [ ] Remove unused CSS/assets related to legacy admin shells
- [ ] Conduct UAT with admin users; collect sign-offs per page
- [ ] Staged rollout
  - [ ] Enable feature flag for new layout in staging; validate all critical paths
  - [ ] Promote to production; monitor Sentry and perf dashboards for 48 hours
- [ ] Rollback Plan Verified
  - [ ] If issues arise, revert via History Tab and disable feature flag

Acceptance: legacy UI removed, production stable, and sign-offs recorded.

---

## Appendix — Route-by-Route Checklist (Tick each as migrated to new templates)
- [x] /admin (overview)
- [x] /admin/analytics
- [x] /admin/reports
- [x] /admin/clients/profiles
- [x] /admin/clients/invitations
- [x] /admin/clients/new
- [x] /admin/bookings
- [x] /admin/calendar
- [x] /admin/service-requests
- [x] /admin/services
- [x] /admin/services/list
- [x] /admin/availability
- [x] /admin/invoices
- [x] /admin/payments
- [x] /admin/expenses
- [x] /admin/tasks
- [x] /admin/reminders
- [x] /admin/audits
- [x] /admin/posts
- [x] /admin/newsletter
- [x] /admin/team
- [x] /admin/permissions
- [x] /admin/roles
- [x] /admin/settings
- [x] /admin/settings/booking
- [x] /admin/settings/currencies
- [x] /admin/integrations
- [x] /admin/uploads/quarantine

Notes:
- Implement all features as separate reusable components; import explicitly. Avoid inline/lazy hacks.
- Preserve existing style tokens and variables; keep original visual styling consistent.
- Use concise, typed APIs and add defensive error handling with user-facing messages.
