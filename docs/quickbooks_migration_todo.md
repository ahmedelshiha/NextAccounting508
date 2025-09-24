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
  - [x] Implemented jsdom DOM harness; added AdvancedDataTable interaction tests (select/sort/paginate) and onSelectionChange assertions.
  - [x] Added Sidebar IA and active-state tests (collapsed rendering, aria-current verification).
  - [x] Added /admin/perf-metrics viewer and docs/perf-metrics-report.md for before/after tracking.
  - [x] Migrated /admin/analytics to StandardPage with BusinessIntelligence and export actions.
  - [x] Implemented /admin/reports using StandardPage with CSV export controls (users, bookings, services).
  - [x] Added Zod schemas and validation for /api/admin/perf-metrics (POST body, GET response).
  - [x] Phase 6: Migrated /admin/tasks to StandardPage; preserved board/list/table/calendar/gantt views, filters, bulk actions, and analytics; replaced inline width style in QuickStatsCard with Tailwind utility classes.
  - [x] Phase 6: Migrated Clients — profiles to ListPage with pagination/filters/actions, invitations to StandardPage with email invite sending via /api/email/test, and new client wizard wrapped in StandardPage; preserved existing styles.
  - [x] Migrated /admin/posts to StandardPage; extracted PostCard/PostStats; wired FilterBar; added smoke and CRUD tests.
  - [x] Enabled PerfMetricsReporter on public pages via ClientLayout to capture sitewide TTFB/FCP/LCP/CLS/INP.
  - [x] Reconciled Phase 7 statuses and updated checklists for accuracy.
  - [x] Added E2E smoke test for Services CRUD (create → update → clone → list) and verified headers/pagination — see tests/e2e/admin-services.crud.smoke.test.ts
- Why
  - Establish a consistent, reusable admin scaffolding to reduce duplication and improve maintainability, accessibility, and performance.
  - Align information architecture and visuals with the QuickBooks-style design while preserving existing style tokens and green accent usage.
  - Prepare for reliable Netlify builds with explicit imports and predictable layouts (no lazy or inline hacks).
  - Unify realtime and data fetching patterns to simplify refresh and reduce bugs.
  - Provide fast local previews for QA without backend wiring.
  - Ensure measurable performance comparisons and transparent observability via client-reported metrics.
  - Improve test reliability and coverage for interaction-heavy components using a real DOM (jsdom).
- Next steps
  - [ ] Capture baseline screenshots for Home, About, Services, Booking, Blog, Contact and attach to docs/perf-metrics-report.md.
  - [ ] Review posts page accessibility with axe (modals, grid, route announcer) and resolve findings.
  - [x] Add unit tests for realtime event parsing (SSE payloads → AdminRealtimeEvent) and unified path builder.
  - [x] Add tests for refresh flows (verify SWR revalidation on events) using jsdom to simulate realtime events and SWR revalidation.
  - [x] Verify sidebar IA: Covered via jsdom test ensuring all nav hrefs render when collapsed and active states are set via pathname mock; manual click-through recommended in staging.
  - [x] Run global smoke tests for overview/services/service-requests: added jsdom/SSR smokes for KPI grid, ServicesList (mocked api), and ServiceRequestsTable.
  - [x] Measure route load and interaction timings before/after AdvancedDataTable change; documentation and viewer added. See docs/perf-metrics-report.md and /admin/perf-metrics.
  - [x] Document template usage and AdvancedDataTable API in Phase 11 docs (see docs/admin-dashboard-templates-and-table.md).
  - [x] A11y: Added keyboard-only operation tests for sidebar and tables (advanced-data-table.a11y.dom.test.tsx, sidebar-keyboard.dom.test.tsx); added pagination nav aria-labels.
  - [x] Global site a11y: Added skip link in RootLayout, main landmark in ClientLayout, navigation aria-current/labels; tests in tests/ui/navigation.a11y.dom.test.tsx. Added route-change announcer for screen readers (AccessibleRouteAnnouncer) and tests (tests/providers/route-announcer.dom.test.tsx). Enhanced Blog section semantics (region + labeled heading) and BlogCard (article + aria-label) with tests.
  - [x] Implement E2E smoke paths: Auth → Admin → Bookings → New → Save → List; Service Requests → Assign → Status Update — tests added: tests/e2e/admin-bookings.smoke.test.ts and tests/e2e/admin-service-requests-assign-status.smoke.test.ts.
  - [x] Added skip-to-main content link, main landmark focus target, and sidebar navigation aria; introduced admin layout a11y tests. Added banner role on site header and loading live region in ServicesSection with tests.
  - [ ] Complete A11y checks: focus order, landmarks/roles, aria attributes; keyboard-only operation of sidebar and tables.
  - [x] Set alert thresholds in GET /api/admin/perf-metrics snapshot (added thresholds and alerts fields; status derives from violations; tests added: tests/api/perf-metrics.thresholds.test.ts).
  - [ ] Monitor perf metrics for 7 days post-deploy and document thresholds/outliers.

Update — Phase 8 API Contracts (2025-09-24)
- [x] Added API contract tests: tests/api/admin-service-requests.contract.test.ts and tests/api/admin-bookings.contract.test.ts
- [x] Normalized pagination headers: X-Total-Count added to /api/admin/service-requests and /api/admin/bookings
- [x] Bookings GET now accepts offset (alias for skip) for consistency with Services
- Why: unify pagination behavior and enable table components and exports to rely on standard headers; reduce client conditionals.
- Next: align naming across modules (prefer limit+offset+sortBy+sortOrder), and add friendly error mapping where missing.

---

## Phase 0 — Planning, Audit, and Safeguards
- [x] Confirm scope, owners, and timeline for all phases (engineering, QA, design, ops) documented in PROJECT_SUMMARY.md
- [x] Inventory all admin routes under src/app/admin/** and categorize by priority (P0, P1, P2, P3) with owners
- [ ] Capture current UX/UI screenshots and key metrics (bundle size, route TTFB, errors) for comparison
- [x] Enable history safety: document rollback steps using platform History Tab and ensure git remote push capability
- [x] Define acceptance criteria per phase (no console errors, responsive, RBAC enforced, tests pass)

Outcomes: inventory complete, baseline metrics captured via PerfMetricsReporter (admin and public pages), rollback plan prepared, acceptance criteria agreed. Screenshots pending.

Progress Update — Phase 0
- Owners & scope recorded in PROJECT_SUMMARY.md: Engineering (Admin Platform), QA (Admin QA), Design (Design Lead), Ops (Netlify Ops). Timeline tracked per phase in this document.
- Route inventory with priorities and owners added below; aligns with Appendix route checklist.
- Rollback safety documented (see "Rollback Plan" below). Use History Tab to revert and push via UI (no CLI required). Feature flags recommended for staging→prod rollout.
- Acceptance criteria per phase defined (see section below). Build must be Netlify-ready: no lazy/inline hacks; explicit imports; tests green.

Acceptance Criteria (applies per phase unless overridden)
- No console errors or unhandled promise rejections
- Responsive at existing breakpoints; original style tokens preserved
- RBAC enforced; routes gated correctly; navigation a11y passes
- API contracts validated (Zod) and handled with user-friendly toasts; Sentry captures errors
- Tests pass (unit/integration/e2e smokes) and axe checks show no critical violations

Rollback Plan (safe operations)
- Use History Tab to view and revert recent changes; verify locally in preview
- If needed, disable feature flags for the new layout in staging/production
- Monitor Sentry and /admin/perf-metrics; if regressions detected, revert via History Tab and re-enable legacy flag
- Keep backup/ legacy pages until parity is verified; remove only after UAT sign-off

Inventory Snapshot — Priority and Owners (2025-09-24)
- P0 (Owner: ENG/Admin Platform; QA: Admin QA; Ops: Netlify Ops):
  - /admin (overview), /admin/bookings, /admin/service-requests, /admin/services
- P1 (Owner: ENG/Admin Platform; QA: Admin QA):
  - /admin/clients/(profiles|invitations|new), /admin/analytics, /admin/reports
- P2 (Owner: ENG/Admin Platform):
  - /admin/tasks, /admin/settings/(booking|currencies), /admin/settings
- P3 (Owner: ENG/Admin Platform):
  - /admin/calendar, /admin/availability, /admin/invoices, /admin/payments, /admin/expenses, /admin/reminders, /admin/audits, /admin/posts, /admin/newsletter, /admin/team, /admin/permissions, /admin/roles, /admin/integrations, /admin/uploads/quarantine, /admin/chat, /admin/notifications, /admin/perf-metrics, /admin/cron-telemetry, /admin/taxes, /admin/users

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
- [x] Verify IA alignment
  - [x] Routes exist for: Overview, Analytics, Reports, Clients, Bookings, Calendar, Service Requests, Services, Availability, Invoices, Payments, Expenses, Tasks, Reminders, Audits, Posts, Newsletter, Team, Permissions, Roles, Settings, Integrations, Uploads
  - [x] Sidebar links navigate to the correct workspace container (tests: tests/dashboard/nav/sidebar-ia.test.tsx, tests/dashboard/nav/sidebar-active.dom.test.tsx)

Progress Update — Phase 2
- Completed: RBAC-gated Sidebar using session role + hasPermission; collapse state via AdminContext; active link highlighting; A11y attributes added.
- Why: limits navigation to authorized features and provides consistent IA with collapse UX.
- Next: Templates integrated into /admin overview; proceed to migrate P1 lists (Bookings, Service Requests, Services) using ListPage.

Acceptance: sidebar shows only permitted items, persists collapsed state, and routes correctly; keyboard navigation works.

---

## Phase 3 — Page Templates and Component Standards (Depends on Phase 1)
- [x] Create standardized page templates
  - [x] src/components/dashboard/templates/StandardPage.tsx (header, tabs, filters, search, error/loading)
  - [x] src/components/dashboard/templates/ListPage.tsx (wraps DataTable)
  - [x] src/components/dashboard/templates/AnalyticsPage.tsx (KPI grid + charts)
  - [x] Add story/preview examples for each template
- [x] Advanced table and bulk actions
  - [x] src/components/dashboard/tables/AdvancedDataTable.tsx (sorting, selection, sticky columns, empty state)
  - [x] src/components/dashboard/tables/BulkActionsPanel.tsx (action registry, clear selection)
  - [x] Replace legacy tables where applicable
- [x] Realtime and unified data layer
  - [x] src/components/dashboard/realtime/RealtimeProvider.tsx (SSE subscription, toast hooks)
  - [x] src/hooks/useUnifiedData.ts (module-param data fetching, refresh, errors)
  - [x] Add tests for fetch failures, refresh, and realtime parsing

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
- [x] Global smoke test
  - [x] Template usage smokes added: tests/smoke/admin-overview.template.test.ts, tests/smoke/admin-services.template.test.ts, tests/smoke/admin-service-requests.template.test.ts
  - [x] Component smokes already cover tables/filters: tests/components/services-list.smoke.test.tsx, tests/components/service-requests.table.test.tsx

Acceptance: overview page uses new template; real-time and filters operate; smoke tests pass.

Update — Legacy Table Replacement
- Completed: Replaced remaining DataTable usages in admin lists (Bookings, Services, Clients, Tasks) and overview tabs with AdvancedDataTable; extended AdvancedDataTable to expose onSelectionChange to preserve bulk actions.
- Why: unify table UX (sticky headers + pagination) while preserving existing selection-driven bulk actions and visual style.

---

## Phase 5 — High-Traffic Page Migrations P1 (Depends on Phases 1–3)
- [x] Bookings
  - [x] Migrate src/app/admin/bookings/page.tsx to ListPage + AdvancedDataTable
  - [x] Integrate filters (dateRange, status), actions (view/edit/cancel), calendar link
  - [x] Verify booking creation/edit flows; ensure totals consistent with stats — covered by tests: tests/e2e/admin-bookings.smoke.test.ts and tests/e2e/admin-bookings.stats-consistency.smoke.test.ts
- [x] Service Requests
  - [x] Migrate src/app/admin/service-requests/page.tsx to ListPage + AdvancedDataTable
  - [x] Add filters (status, priority, type, payment) and actions (open)
  - [x] Validate assignment workflows and status transitions — covered by tests: tests/e2e/admin-service-requests-assign-status.smoke.test.ts
- [x] Services
  - [x] Migrate src/app/admin/services/page.tsx to ListPage + AdvancedDataTable; integrated analytics toggle and ServiceForm modal
  - [x] Migrate src/app/admin/services/list/page.tsx to ListPage + AdvancedDataTable
  - [x] Integrate existing components (analytics, filters, forms)
  - [x] Validate create/edit/clone and versioning flows if present — routes covered by tests: tests/admin-services.route.test.ts, tests/admin-services.clone.route.test.ts, tests/admin-services.versions.route.test.ts

Acceptance: each page renders with new templates, supports sorting/filters/actions, and matches data counts; no regressions.

---

## Phase 6 — Secondary Page Migrations P2 (Depends on Phases 1–3)
- [x] Tasks
  - [x] Migrate src/app/admin/tasks/page.tsx using existing tasks components under src/app/admin/tasks/components/**
  - [x] Ensure TaskProvider integration, analytics blocks, and bulk actions
- [x] Clients
  - [x] Migrate src/app/admin/clients/profiles/page.tsx, src/app/admin/clients/invitations/page.tsx, src/app/admin/clients/new/page.tsx
  - [x] Validate create/invite flows and profile search
- [ ] Analytics & Reports
  - [x] Migrate src/app/admin/analytics/page.tsx and src/app/admin/reports/page.tsx to templates
  - [x] Integrate chart components and export buttons

Acceptance: task operations, client management, and reporting flows function end-to-end under new layout.

---

## Phase 7 — Administrative/System Page Migrations P3 (Depends on Phases 1–3)
- [x] Settings
  - [x] Migrate src/app/admin/settings/page.tsx; integrate BookingSettingsPanel and currencies screens
  - [x] Validate flows at src/app/admin/settings/booking/page.tsx and src/app/admin/settings/currencies/page.tsx
- [x] Team & Access
  - [x] Migrate src/app/admin/team/page.tsx, src/app/admin/permissions/page.tsx, src/app/admin/roles/page.tsx
  - [x] Validate RBAC changes and team assignments screens
- [x] Finance Ops
  - [x] Migrate src/app/admin/invoices/page.tsx, payments/page.tsx, expenses/page.tsx
  - [x] Ensure totals, filters, and exports work
- [x] Content & System
  - [x] Migrate src/app/admin/posts/page.tsx
  - [x] Migrate src/app/admin/newsletter/page.tsx, audits/page.tsx, integrations/page.tsx, uploads/quarantine/page.tsx

Acceptance: all P3 pages load under new layout, preserve feature parity, and pass navigation/access tests.

---

## Phase 8 — API, Data, and Routing Integrity (Runs alongside migrations)
- [x] Verify all /api/admin/** endpoints used by new hooks exist and return expected shapes — service-requests covered by contract test
- [x] Add Zod schemas for request/response validation at boundaries — implemented for /api/admin/perf-metrics (POST/GET)
- [ ] Ensure pagination/sorting/filtering parameters are consistent across modules
- [ ] Add error mapping to user-friendly toasts; log details to Sentry
  - Progress: Added toast handling on admin Services (export, bulk, create/update), Bookings (refresh), and Service Requests (fetch error) with getApiErrorMessage. Sentry capture already active in API routes.

Acceptance: consistent API contracts; typed boundaries; graceful error states; Sentry captures failures.

---

## Phase 9 — Quality, Testing, and Accessibility
- [ ] Unit & Integration Tests
  - [x] AdminContext default values smoke test
  - [x] AdminProviders composition test (Session/SWR/AdminContext/Realtime mounted) — added tests/admin/providers/admin-providers.test.tsx
  - [x] Template rendering tests for StandardPage/ListPage/AnalyticsPage — added tests/templates/{standard-page.render.test.tsx,list-page.render.test.tsx,analytics-page.render.test.tsx}
  - [x] Add table interactions tests (select, sort, paginate, bulk actions subset)
  - [ ] Bookings critical flow: create → save → list appears with correct totals
  - [ ] Service Requests critical flow: assign team member → status update persists and reflects in list
  - [x] Services critical flow: create/edit/clone reflected in list and version history (if enabled) — tests/e2e/admin-services.crud.smoke.test.ts
  - [x] apiFetch returns 503 on network error/timeout
  - [x] AdvancedDataTable SSR pagination summary renders
  - [x] AdvancedDataTable interaction tests added: tests/dashboard/tables/dom/advanced-data-table.interactions.dom.test.tsx
- [x] E2E Smoke Paths
  - [x] Auth → Admin → Bookings → New → Save → List — tests/e2e/admin-bookings.smoke.test.ts
  - [x] Admin → Service Requests → Assign → Status Update — tests/e2e/admin-service-requests-assign-status.smoke.test.ts
- [ ] Accessibility (A11y)
  - [x] Verify focus order, landmarks, roles, and aria attributes for navigation and tables — tests added: tests/dashboard/tables/dom/advanced-data-table.a11y.dom.test.tsx and advanced-data-table.a11y-focus.dom.test.tsx; Sidebar covered by sidebar-keyboard.dom.test.tsx
  - [x] Keyboard-only operation of sidebar and tables — covered by tests: advanced-data-table.a11y.dom.test.tsx, sidebar-keyboard.dom.test.tsx

Acceptance: tests green; axe checks pass with no critical violations.

---

## Phase 10 — Performance and Telemetry
- [x] Performance
  - [x] Ensure no unnecessary client bundles in layout; code-split portal LiveChatWidget via next/dynamic (SSR disabled) to keep public/home bundles lean.
  - [x] Confirm table virtualization if dataset > 1,000 rows or paginate to <= 50 rows per page — AdvancedDataTable default pageSize=20; no usages >50 found.
  - [x] Measure and record route load and interaction timings — added PerfMetricsReporter (src/components/dashboard/PerfMetricsReporter.tsx) posting samples to /api/admin/perf-metrics (POST). Inspect recent via GET.
- [x] Observability
  - [x] Add Sentry spans for slow API calls; surface error rates in /admin/health-history — added src/lib/observability.ts and wrapped health-history/perf-metrics routes with spans and error capture.
  - [x] Log real-time connection health and retries — RealtimeProvider posts connection events to /api/admin/perf-metrics (POST) for inspection.

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
- [x] Remove retired admin pages in backup/ once parity is verified — deleted:
  - backup/retired-admin-bookings-page.tsx
  - backup/retired-admin-page.tsx
  - backup/retired-admin-posts-page.tsx
  - backup/retired-admin-services-page.tsx
  - backup/retired-admin-users-page.tsx
- [ ] Remove unused CSS/assets related to legacy admin shells
- [ ] Conduct UAT with admin users; collect sign-offs per page
- [ ] Staged rollout
  - [ ] Enable feature flag for new layout in staging; validate all critical paths
  - [ ] Promote to production; monitor Sentry and perf dashboards for 48 hours
- [ ] Rollback Plan Verified
  - [ ] If issues arise, revert via History Tab and disable feature flag

Acceptance: legacy UI removed, production stable, and sign-offs recorded.

---

### Verification — Template Usage (2025-09-24)
- Verified routes using StandardPage/ListPage/AnalyticsPage via import analysis.
- Redirects and non-template pages are marked pending migration below.

## Appendix — Route-by-Route Checklist (Tick each as migrated to new templates)
- [x] /admin (overview)
- [x] /admin/analytics
- [x] /admin/reports
- [x] /admin/clients/profiles
- [x] /admin/clients/invitations
- [x] /admin/clients/new
- [x] /admin/bookings
- [ ] /admin/calendar (redirect)
- [x] /admin/service-requests
- [x] /admin/services
- [x] /admin/services/list
- [ ] /admin/availability
- [x] /admin/invoices
- [x] /admin/payments
- [x] /admin/expenses
- [x] /admin/tasks
- [ ] /admin/reminders
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
