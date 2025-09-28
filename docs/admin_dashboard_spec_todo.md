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

## 0A) Route-by-Route Audit (Current State → Actions)
Legend: [x] implemented/verified, [ ] required

- /admin (overview)
  - [x] Uses AnalyticsPage template with providers
  - [ ] KPIs wired: bookings, service-requests, revenue, utilization (APIs: /api/admin/bookings/stats, /api/admin/service-requests/analytics, /api/admin/stats/users, /api/admin/services/stats)
  - [ ] Realtime updates via RealtimeProvider for counts
  - [x] RBAC: allow ADMIN/TEAM_LEAD, redirect others
  - Actions
    - [x] Replace static page with AnalyticsPage using ProfessionalKPIGrid and charts
    - [ ] Fetch metrics server-side; hydrate charts client-side; add export hooks
    - [ ] Subscribe to ['updates','service-request-updated','task-updated'] for revalidation
    - Verify: KPIs render <400ms, events update UI ≤2s, RBAC redirects correct

- /admin/analytics
  - [ ] Page exists with RBAC checks; renders AnalyticsDashboard
  - [ ] Adopt AnalyticsPage template for consistent layout and actions
  - [ ] Add export scheduling and CSV hooks where applicable
  - Verify: Access only ADMIN/TEAM_LEAD; visual parity maintained

- /admin/reports
  - [ ] Uses StandardPage
  - [ ] Ensure exports hit /api/admin/export with filter propagation and progress toasts
  - Verify: Exports complete and download link works; audit entries logged

- /admin/clients/profiles
  - [ ] Uses ListPage with SWR
  - [ ] Verify pagination/sort use AdvancedDataTable contract; enforce ���50 rows/page
  - [ ] Ensure export respects active filters
  - Verify: URL sync for filters; CSV matches rows

- /admin/clients/invitations
  - [x] Uses StandardPage
  - [x] RBAC gate (USERS_MANAGE); add PermissionGate if missing
  - Verify: Non-admin sees fallback

- /admin/clients/new
  - [ ] Uses StandardPage
  - [ ] Validate form with zod; show field-level errors; success toasts; audit log
  - Verify: Invalid payload rejected; audit record present

- /admin/bookings
  - [ ] Uses ListPage; uses usePermissions
  - [ ] Ensure server pagination + sort delegated to /api/admin/bookings
  - [ ] Add bulk actions (export, status) if missing
  - Verify: Pending count matches /api/admin/bookings/pending-count

- /admin/calendar (redirect)
  - [x] Replace redirect with calendar workspace using day/week/month views
  - [ ] Data: bookings + availability via /api/admin/availability-slots and /api/admin/bookings
  - [ ] Interactions: click-to-create, drag-to-reschedule (PATCH booking), availability toggle
  - Verify: Drag-reschedule issues PATCH and revalidates; mobile responsive

- /admin/service-requests
  - [ ] Uses ListPage; realtime via useRealtime in ClientPage
  - [ ] Ensure bulk approve/reject/convert wired to /api/admin/service-requests/bulk
  - [ ] Export to CSV via /api/admin/service-requests/export (streams)
  - Verify: SSE updates table; bulk results toast

- /admin/services and /admin/services/list
  - [ ] Use ListPage
  - [ ] Wire slug-check (/api/admin/services/slug-check/[slug]) and versions/settings panels
  - [ ] Analytics tab uses /api/admin/services/stats
  - Verify: Clone/version actions work; stats render

- /admin/availability
  - [ ] Uses StandardPage with AvailabilitySlotsManager
  - [ ] Confirm create/update/delete call /api/admin/availability-slots with tenant guard
  - Verify: Slots persist; tenant isolation enforced

- /admin/invoices
  - [ ] Uses ListPage
  - [ ] Ensure payments linkage (view invoice → payments) and export hooks
  - Verify: Currency formatting uses settings; totals accurate

- /admin/payments
  - [ ] Uses ListPage
  - [ ] Add filters (method/status/date) and export
  - Verify: Filters reflect URL; CSV correct

- /admin/expenses
  - [ ] Uses ListPage
  - [ ] Add categories and attachment preview; export
  - Verify: AV status badge on attachments

- /admin/tasks
  - [ ] Uses StandardPage; rich views available under components/**
  - [ ] Ensure Board/List/Table/Calendar/Gantt routes/toggles present; use existing components
  - [ ] Notifications settings wired to /api/admin/tasks/notifications
  - Verify: Drag across columns; analytics from /api/admin/tasks/analytics

- /admin/reminders
  - [ ] Uses StandardPage; server RBAC check
  - [ ] Run reminders via /api/admin/reminders/run with result toast and audit entry
  - Verify: Unauthorized path returns fallback; success logs exist

- /admin/audits
  - [ ] Uses StandardPage
  - [ ] Data from /api/admin/activity and /api/admin/health-history; filters and export CSV
  - Verify: Actor/module/date filters work; CSV includes visible rows only

- /admin/posts
  - [ ] Uses StandardPage with apiFetch
  - [ ] Enforce RBAC; adopt ListPage for table UX; hook into /api/admin/stats/posts for KPIs
  - Verify: Draft/published filters; author aggregation visible

- /admin/newsletter
  - [ ] Uses StandardPage
  - [ ] Export CSV button hits /api/admin/export?entity=newsletter; add import validation if needed
  - Verify: Export contains subscriber fields; errors surfaced

- /admin/team
  - [ ] Uses StandardPage with TeamManagement
  - [ ] Wire workload/skills/availability to respective APIs under /api/admin/team-management/*
  - Verify: Charts render; updates persist

- /admin/permissions and /admin/roles
  - [ ] Use StandardPage + PermissionGate
  - [ ] Ensure role edits persist and reflect immediately in UI
  - Verify: hasPermission checks change post-save without reload

- /admin/settings
  - [ ] Uses StandardPage
  - [ ] Add sidebar nav; split general/company/contact/timezone sections; optimistic saves
  - Verify: zod schema; rollback on error

- /admin/settings/booking
  - [x] Uses StandardPage + PermissionGate; BookingSettingsPanel
  - [ ] Wire steps, business-hours, payment-methods endpoints for CRUD
  - Verify: Validate route; audit entries on change

- /admin/settings/currencies
  - [ ] Uses StandardPage with CurrencyManager
  - [ ] Verify overrides/export/refresh endpoints; default currency persisted
  - Verify: Rates refresh; override precedence documented

- /admin/integrations
  - [ ] Uses StandardPage
  - [ ] Add cards for status checks; link to docs; RBAC gate if needed
  - Verify: Health badges reflect /api/admin/system/health

- /admin/uploads/quarantine
  - [ ] Uses StandardPage with QuarantineClient
  - [ ] Actions release/delete call /api/admin/uploads/quarantine; reflect AV status; audit changes
  - Verify: Infected files blocked until release

## 1) Core Layout, Providers, and Navigation IA
- [x] Standardize admin shell
  - Implement/confirm components: components/admin/layout/AdminHeader.tsx, AdminSidebar.tsx, AdminFooter.tsx, AdminErrorBoundary.tsx, ClientOnlyAdminLayout.tsx
  - Acceptance: All admin routes share a common shell (src/app/admin/layout.tsx) with fixed left sidebar, header, content area, footer
  - Verify: Visual check across /admin/* routes; layout snap tests.
- [x] Wire global providers in admin context
  - Use components/dashboard/realtime/RealtimeProvider.tsx, components/admin/providers/AdminProviders.tsx, stores/adminLayoutStore*.ts
  - Acceptance: Realtime connection state available via context; permission and tenant state available globally
  - Verify: Unit tests confirming context values and fallback behavior when disconnected.
- [x] Implement navigation information architecture (IA)
  - Sidebar sections and links exactly as in the spec’s “Navigation Architecture” with route targets under src/app/admin/**
  - Acceptance: Keyboard-nav friendly, active-route highlighting, collapsible groups, badges for counts (e.g., pending)
  - Verify: tests/dashboard/nav/sidebar-ia.test.tsx and tests/dashboard/nav/sidebar-keyboard.dom.test.tsx pass; manual tab/arrow navigation.

... (rest of file preserved)

## Documentation Update – 2025-09-28 (Admin Overview RBAC + Server/Client Split)
- [x] What was completed
  - Added RBAC guard to /admin: only ADMIN and TEAM_LEAD allowed; others redirected
  - Refactored /admin/page.tsx to a server component wrapper with session + role checks
  - Extracted client dashboard into src/components/admin/dashboard/AdminOverview.tsx and dynamically loaded it
- [x] Why it was done
  - Enforce least-privilege access and align with spec requirements
  - Prepare for server-side data hydration while maintaining current client data flows
- [x] Implementation Summary
  - Updated: src/app/admin/page.tsx (server component with RBAC)
  - Added: src/components/admin/dashboard/AdminOverview.tsx (client dashboard)
- [ ] Next steps
  - Add initial server-side data fetch to hydrate KPIs (bookings/stats, services/stats, stats/users)
  - Confirm RealtimeProvider emits counts for overview KPIs
  - Extend tests to cover /admin RBAC redirects
