# QuickBooks-Style Admin Dashboard Migration — Ordered TODO Checklist

Purpose: Execute the transformation plan from docs/migration_plan_comprehensive.md and docs/quickbooks_transformation_plan.md with clear, actionable, dependency-ordered tasks. Each task is specific, measurable, and outcome-oriented.

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
- [ ] Create global admin layout wrapper
  - [ ] Implement src/app/admin/layout.tsx using DashboardLayout and AdminProviders
  - [ ] Enforce auth/redirect via getServerSession + RBAC check
  - [ ] Validate children render correctly across all /admin routes
- [ ] Add Admin context/providers
  - [ ] Implement src/components/admin/providers/AdminProviders.tsx (SWRConfig, SessionProvider, ToastProvider)
  - [ ] Implement src/components/admin/providers/AdminContext.tsx (sidebarCollapsed, currentTenant, userPermissions)
  - [ ] Add unit tests for context behavior and loading states
- [ ] Replace legacy shells
  - [ ] Remove/disable legacy overlays/wrappers that conflict with DashboardLayout
  - [ ] Verify only one layout wraps /admin pages

Acceptance: all /admin pages render under the new layout without visual overlaps; login/portal redirects correct; zero console errors.

---

## Phase 2 — Navigation and IA (Depends on Phase 1)
- [ ] Implement permission-based sidebar
  - [ ] Create/upgrade src/components/dashboard/layout/Sidebar.tsx with groups, badges, RBAC filters
  - [ ] Wire to AdminContext (collapse/expand) and active route highlighting
  - [ ] Ensure accessibility (keyboard navigation, aria-current, focus states)
- [ ] Verify IA alignment
  - [ ] Routes exist for: Overview, Analytics, Reports, Clients, Bookings, Calendar, Service Requests, Services, Availability, Invoices, Payments, Expenses, Tasks, Reminders, Audits, Posts, Newsletter, Team, Permissions, Roles, Settings, Integrations, Uploads
  - [ ] Sidebar links navigate to the correct workspace container

Acceptance: sidebar shows only permitted items, persists collapsed state, and routes correctly; keyboard navigation works.

---

## Phase 3 — Page Templates and Component Standards (Depends on Phase 1)
- [ ] Create standardized page templates
  - [ ] src/components/dashboard/templates/StandardPage.tsx (header, tabs, filters, search, error/loading)
  - [ ] src/components/dashboard/templates/ListPage.tsx (wraps DataTable)
  - [ ] src/components/dashboard/templates/AnalyticsPage.tsx (KPI grid + charts)
  - [ ] Add story/preview examples for each template
- [ ] Advanced table and bulk actions
  - [ ] src/components/dashboard/tables/AdvancedDataTable.tsx (sorting, selection, sticky columns, empty state)
  - [ ] src/components/dashboard/tables/BulkActionsPanel.tsx (action registry, clear selection)
  - [ ] Replace legacy tables where applicable
- [ ] Realtime and unified data layer
  - [ ] src/components/dashboard/realtime/RealtimeProvider.tsx (SSE subscription, toast hooks)
  - [ ] src/hooks/useUnifiedData.ts (module-param data fetching, refresh, errors)
  - [ ] Add tests for fetch failures, refresh, and realtime parsing

Acceptance: new templates compile and are reusable; table supports selection/sort/export; unified data hook verified with mocked endpoints.

---

## Phase 4 — Critical Page Migrations P0 (Depends on Phases 1–3)
- [ ] Dashboard Overview
  - [ ] Migrate src/app/admin/page.tsx to AnalyticsPage
  - [ ] Wire KPIs, charts, and activity components; hook up refresh/export
  - [ ] Validate responsive behavior and realtime status indicator
- [ ] Global smoke test
  - [ ] Login → /admin overview flow works; no layout shifts; zero console errors

Acceptance: overview page uses new template; real-time and filters operate; smoke tests pass.

---

## Phase 5 — High-Traffic Page Migrations P1 (Depends on Phases 1–3)
- [ ] Bookings
  - [ ] Migrate src/app/admin/bookings/page.tsx to ListPage + AdvancedDataTable
  - [ ] Integrate filters (dateRange, status), actions (view/edit/cancel), calendar link
  - [ ] Verify booking creation/edit flows; ensure totals consistent with stats
- [ ] Service Requests
  - [ ] Migrate src/app/admin/service-requests/page.tsx to ListPage + AdvancedDataTable
  - [ ] Add filters (dateRange, status, priority, assignee) and actions (assign/update)
  - [ ] Validate assignment workflows and status transitions
- [ ] Services
  - [ ] Migrate src/app/admin/services/page.tsx and src/app/admin/services/list/page.tsx
  - [ ] Integrate existing components (analytics, filters, forms)
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
  - [ ] Add tests for AdminProviders/AdminContext and templates
  - [ ] Add table interactions tests (select, sort, paginate, bulk actions)
  - [ ] Cover critical flows: bookings CRUD, service-request assign, services edit
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
- [ ] /admin (overview)
- [ ] /admin/analytics
- [ ] /admin/reports
- [ ] /admin/clients/profiles
- [ ] /admin/clients/invitations
- [ ] /admin/clients/new
- [ ] /admin/bookings
- [ ] /admin/calendar
- [ ] /admin/service-requests
- [ ] /admin/services
- [ ] /admin/services/list
- [ ] /admin/availability
- [ ] /admin/invoices
- [ ] /admin/payments
- [ ] /admin/expenses
- [ ] /admin/tasks
- [ ] /admin/reminders
- [ ] /admin/audits
- [ ] /admin/posts
- [ ] /admin/newsletter
- [ ] /admin/team
- [ ] /admin/permissions
- [ ] /admin/roles
- [ ] /admin/settings
- [ ] /admin/settings/booking
- [ ] /admin/settings/currencies
- [ ] /admin/integrations
- [ ] /admin/uploads/quarantine

Notes:
- Implement all features as separate reusable components; import explicitly. Avoid inline/lazy hacks.
- Preserve existing style tokens and variables; keep original visual styling consistent.
- Use concise, typed APIs and add defensive error handling with user-facing messages.
