# Admin Dashboard Implementation Plan — Dependency-Ordered TODO

Scope: Implement the QuickBooks-inspired professional admin dashboard defined in docs/admin_dashboard_spec.md, aligning with existing code under src/app/admin/** and components/**. Each task is specific, measurable, and outcome-oriented, with verification steps.

## Reorganized, Dependency-Ordered Execution Plan

1) Platform Foundations
- [ ] Ensure typecheck and prod build green (pnpm typecheck, pnpm vercel:build)
- [ ] Finalize RBAC permission matrix and enforce on all admin pages
- [ ] Implement tenant switcher and verify tenant-scoped data on key routes
- [x] Unify list/table contracts with AdvancedDataTable across modules
- [x] Define realtime event contracts (event names, payloads) and document

2) Data Models & APIs
- [ ] Design and migrate Work Orders data model in Prisma; generate CRUD APIs under /api/admin/work-orders
- [ ] Standardize pagination/filter/query params across admin APIs; add schema validation

3) Dashboard Overview (depends on 2)
- [ ] Implement KPI row (bookings, service-requests, revenue, utilization) using existing endpoints
- [ ] Add charts row (Work Order Trends line, Revenue by Service donut); server-fetch + client hydrate
- [ ] Add activity row (ActivityFeed, UpcomingTasks, RecentBookings) with SSE refresh

4) Financial Module (depends on 2)
- [ ] Invoices: propose Prisma model, create endpoints, and wire ListPage (blocked until schema approved)
- [ ] Link invoice row actions to payments view with preserved filters
- [x] Payments: status/method/date filters with URL sync and CSV export
- [ ] Expenses: ListPage, category filters, attachment preview; AV status badge; CSV export

5) Team Management & Permissions (depends on 1)
- [ ] Team page using TeamManagement component; wire workload/skills/availability APIs
- [ ] Roles/Permissions: persist edits and reflect changes without reload; verify hasPermission changes live

6) Settings Hub (depends on 1)
- [ ] Admin Settings shell with sidebar nav (general/company/contact/timezone)
- [ ] Forms use zod; optimistic saves with rollback on error; acceptance: 0 console errors
- [ ] Booking Settings: wire steps, business-hours, payment-methods CRUD endpoints with audit logging

7) Content & Communications (independent)
- [x] Posts: RBAC enforced; page marked 'use client'
- [ ] Posts: adopt ListPage UX and hook into /api/admin/stats/posts for KPIs
- [ ] Integrations: status cards; health badges reflecting /api/admin/system/health; links to docs

8) Analytics & Reports (depends on 2)
- [ ] Adopt AnalyticsPage on relevant routes; unify export flows to /api/admin/export with filter propagation
- [ ] Report scheduling stubs and progress toasts

9) Observability & Security (continuous)
- [ ] Update monitoring/performance-baseline.json; LCP <=2.5s desktop, TTI <=3.5s admin pages
- [ ] Expand audit trail coverage; Sentry error sampling verified in prod

10) Testing & Rollout
- [ ] Unit tests for schemas, permissions, and utilities (vitest)
- [ ] Integration tests for key API routes (no threads)
- [ ] E2E happy paths for admin flows (Playwright)
- [ ] Feature-flag rollout plan documented in this file

---

## Priority Backlog (Pending Tasks Ordered)

P0 – Critical
- [ ] Ensure typecheck and prod build green (pnpm typecheck, pnpm vercel:build)
- [ ] Finalize RBAC permission matrix and enforce on all admin pages
- [x] Unify list/table contracts with AdvancedDataTable across modules
- [x] Define realtime event contracts (event names, payloads) and document

P1 – High
- [ ] Design and migrate Work Orders data model in Prisma; generate CRUD APIs under /api/admin/work-orders
- [ ] Standardize pagination/filter/query params across admin APIs; add schema validation
- [ ] Dashboard Overview: implement KPI row, charts row, and activity row with SSE refresh
- [ ] Settings Hub: sidebar nav; zod forms; optimistic saves with rollback; Booking Settings CRUD endpoints with audit logging
- [ ] Analytics & Reports: adopt AnalyticsPage across routes; unify export flows to /api/admin/export with filter propagation

P2 – Medium
- [ ] Invoices: propose Prisma model, endpoints, and wire ListPage (blocked until schema approved)
- [ ] Link invoice row actions to payments view with preserved filters
- [ ] Expenses: ListPage, category filters, attachment preview; AV status badge; CSV export
- [ ] Team: TeamManagement with workload/skills/availability APIs; role edits reflect without reload
- [ ] Posts: adopt ListPage and hook into /api/admin/stats/posts for KPIs
- [ ] Integrations: status cards; health badges reflecting /api/admin/system/health; links to docs
- [ ] Observability: update monitoring/performance-baseline.json to targets; expand audit trail; verify Sentry sampling
- [ ] Testing & Rollout: unit, integration, E2E; feature-flag rollout plan

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

## 0A) Route-by-Route Audit (Current State ��� Actions)
Legend: [x] implemented/verified, [ ] required

Documentation notes:
- /admin/analytics: Refactor (enhancement) to reuse existing AnalyticsPage template and AdminAnalyticsPageClient for CSV export.
- /admin/calendar: Enhancement to existing calendar page; reused hooks and APIs, added interactions without altering styles.
- /admin/clients/profiles: Enhancement to existing page; added URL-sync and preserved AdvancedDataTable contract.

- /admin (overview)
  - [x] Uses AnalyticsPage template with providers
  - [x] KPIs wired: bookings, service-requests, revenue, utilization (APIs: /api/admin/bookings/stats, /api/admin/service-requests/analytics, /api/admin/stats/users, /api/admin/services/stats)
  - [x] Realtime updates via RealtimeProvider for counts
  - [x] RBAC: allow ADMIN/TEAM_LEAD, redirect others
  - Actions
    - [x] Replace static page with AnalyticsPage using ProfessionalKPIGrid and charts
    - [x] Fetch metrics server-side; hydrate charts client-side; add export hooks
    - [x] Subscribe to ['service-request-updated','task-updated', 'availability-updated', 'booking-updated/created/deleted'] for revalidation
    - Verify: KPIs render <400ms, events update UI ≤2s, RBAC redirects correct

- /admin/analytics
  - [x] Page exists with RBAC checks; renders AnalyticsDashboard
  - [x] Adopt AnalyticsPage template for consistent layout and actions
  - [x] Add CSV export hooks; scheduling deferred to reports module
  - Verify: Access only ADMIN/TEAM_LEAD; visual parity maintained

- /admin/reports
  - [x] Uses StandardPage
  - [x] Ensure exports hit /api/admin/export with filter propagation and progress toasts
  - Verify: Exports complete and download link works; audit entries logged

- /admin/clients/profiles
  - [x] Uses ListPage with SWR
  - [x] Verify pagination/sort use AdvancedDataTable contract; enforce ≤50 rows/page
  - [x] Ensure export respects active filters
  - [x] Verify: URL sync for filters; CSV matches rows

- /admin/clients/invitations
  - [x] Uses StandardPage
  - [x] RBAC gate (USERS_MANAGE); add PermissionGate if missing
  - Verify: Non-admin sees fallback

- /admin/clients/new
  - [x] Uses StandardPage
  - [x] Validate form with zod; show field-level errors; success toasts; audit log
  - Verify: Invalid payload rejected; audit record present
  - Notes: Implemented Zod step schemas on client, added sonner toasts; API now logs audit with actorId when available.

- /admin/bookings
  - [x] Uses ListPage; uses usePermissions
  - [x] Ensure server pagination + sort delegated to /api/admin/bookings
  - [x] Add bulk actions (export, status) if missing
  - Verify: Pending count matches /api/admin/bookings/pending-count

- /admin/calendar (redirect)
  - [x] Replace redirect with calendar workspace using day/week/month views
  - [x] Data: aggregated via /api/admin/calendar (bookings, tasks, availability), with serviceId exposed for availability updates
  - [x] Interactions: click-to-create, drag-to-reschedule (PATCH booking), availability toggle
  - Verify: Drag-reschedule issues PATCH and revalidates; mobile responsive

- /admin/service-requests
  - [x] Uses ClientPage with realtime via useRealtime; table and calendar views
  - [x] Bulk approve/reject/delete wired to /api/admin/service-requests/bulk via ServiceRequestsBulkActions
  - [x] Export to CSV via /api/admin/service-requests/export (streaming CSV)
  - Verify: SSE updates table; bulk results toast
  - Notes: Adopted ClientPage pattern (instead of generic ListPage) to leverage existing table/calendar components and realtime hook.

- /admin/services and /admin/services/list
  - [x] Use ListPage
  - [x] Wire slug-check (/api/admin/services/slug-check/[slug]) and versions/settings panels
  - [x] Analytics tab uses /api/admin/services/stats
  - Verify: Clone/version actions work; stats render

- /admin/availability
  - [x] Uses StandardPage with AvailabilitySlotsManager
  - [x] Confirm create/update/delete call /api/admin/availability-slots with tenant guard
  - Verify: Slots persist; tenant isolation enforced

- /admin/invoices
  - [x] Uses ListPage (UI scaffold only)
  - [x] RBAC gate (ANALYTICS_VIEW)
  - [ ] Ensure payments linkage (view invoice → payments) and export hooks
  - [ ] Implement invoices data source (blocked: no Invoice model in Prisma schema)
  - Verify: Currency formatting uses settings; totals accurate

- /admin/payments
  - [x] Uses ListPage
  - [x] Add filters (method/status/date)
  - [x] Export CSV button hits /api/admin/export?entity=payments
  - [x] URL-sync for status/method/date range filters
  - Verify: Filters reflect URL; CSV correct

- /admin/expenses
  - [ ] Uses ListPage
  - [ ] Add categories and attachment preview; export
  - Verify: AV status badge on attachments

- /admin/tasks
  - [x] Uses StandardPage; rich views enabled (Board/List/Table/Calendar/Gantt)
  - [x] Ensure Board/List/Table/Calendar/Gantt routes/toggles present; use existing components
  - [x] Notifications settings wired to /api/admin/tasks/notifications
  - Verify: Drag across columns; analytics from /api/admin/tasks/analytics

- /admin/reminders
  - [x] Uses StandardPage; server RBAC check
  - [x] Run reminders via /api/admin/reminders/run with result toast and audit entry
  - Verify: Unauthorized path returns fallback; success logs exist

- /admin/audits
  - [x] Uses ListPage + AdvancedDataTable (server-side pagination)
  - [x] RBAC gate (ANALYTICS_VIEW)
  - [x] Data from /api/admin/activity; filters and export CSV via /api/admin/export?entity=audits
  - Verify: Actor/module/date filters work; CSV includes visible rows only

- /admin/posts
  - [x] Uses StandardPage with apiFetch
  - [x] Enforce RBAC
  - [ ] Adopt ListPage for table UX; hook into /api/admin/stats/posts for KPIs
  - Verify: Draft/published filters; author aggregation visible

- /admin/newsletter
  - [x] Uses ListPage + AdvancedDataTable
  - [x] RBAC gate (ANALYTICS_VIEW)
  - [x] Export CSV button hits /api/admin/export?entity=newsletter; server now supports 'newsletter'
  - Verify: Export contains subscriber fields; errors surfaced

- /admin/compliance
  - [x] Uses StandardPage-equivalent layout
  - [x] RBAC gate (ANALYTICS_VIEW)
  - Verify: Health cards and compliance alerts visible only to authorized roles

- /admin/team
  - [ ] Uses StandardPage with TeamManagement
  - [ ] Wire workload/skills/availability to respective APIs under /api/admin/team-management/*
  - Verify: Charts render; updates persist

- /admin/permissions and /admin/roles
  - [x] Use StandardPage + PermissionGate
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
  - [x] Uses StandardPage with CurrencyManager
  - [x] Verify overrides/export/refresh endpoints; default currency persisted
  - Verify: Rates refresh; override precedence documented

- /admin/integrations
  - [ ] Uses StandardPage
  - [ ] Add cards for status checks; link to docs; RBAC gate if needed
  - Verify: Health badges reflect /api/admin/system/health

- /admin/uploads/quarantine
  - [x] Uses StandardPage with QuarantineClient
  - [x] Actions release/delete call /api/admin/uploads/quarantine; reflect AV status; audit changes
  - Verify: Infected files blocked until release

## 1) Core Layout, Providers, and Navigation IA
- [x] Standardize admin shell
- [x] Wire global providers in admin context
- [x] Implement navigation information architecture (IA)

## 2) RBAC and Multi-Tenant Foundations
- [ ] Define permission matrix per module/action
- [ ] Tenant switcher and tenant-scoped data

## 3) Data Contracts and API Readiness
- [ ] Unify list/table contracts with AdvancedDataTable
- [ ] Realtime event contracts
- [ ] Work Orders data model and endpoints (new module)

## 4) Dashboard Overview Page (KPI → Charts → Activity)
- [ ] Implement DashboardOverview page with KPI cards row
- [ ] Charts row: Work Order Trends (line), Revenue by Service (donut)
- [ ] Activity row: ActivityFeed, UpcomingTasks, RecentBookings

## 5) Bookings and Calendar Management
- [ ] Enhance bookings list with “Today”, calendar view, availability slots, recurring bookings

## 6) Service Requests Management
- [ ] List + filters sidebar + bulk actions
- [ ] Review panel with decision actions and pricing estimator

## 7) Tasks Management
- [ ] Views: Board, List, Table, Calendar, Gantt (existing components)

## 8) Services Module
- [ ] Catalog, categories, pricing management, analytics

## 9) Financial Module
- [ ] Invoices, payments, expenses, taxes, invoice sequences

## 10) Team Management and Permissions
- [ ] Staff directory, roles & permissions, performance, workload, skills, availability

## 11) Analytics & Reports
- [ ] Business Intelligence and Performance Metrics pages

## 12) Communications
- [ ] Notifications, chat console, email templates, newsletter

## 13) System Management
- [ ] Settings hub
- [ ] Upload quarantine and system health

## 14) Search, Filters, and Export/Import
- [ ] Unified search and filter controls across modules
- [ ] Export/import everywhere

## 15) Accessibility and UX Standards
- [ ] Keyboard navigation and ARIA labeling
- [ ] Consistent design tokens and components

## 16) Responsive Design
- [ ] Breakpoints and adaptive layouts

## 17) Performance and Reliability
- [ ] Data-access and caching
- [ ] Code-splitting, virtualization, and skeletons

## 18) Observability, Auditing, and Security
- [ ] Audit trail
- [ ] Error monitoring and health checks
- [ ] Security policies

## 19) Page Template Adoption
- [ ] Migrate pages to templates per docs/admin-dashboard-templates-and-api.md

## 20) Testing Strategy (Unit, Integration, E2E)
- [ ] Extend unit tests
- [ ] Integration tests
- [ ] E2E flows

## 21) Rollout and Documentation
- [ ] Feature flag phased rollout
- [ ] Documentation updates

---

## Progress Update – 2025-09-28
- [x] /admin overview: KPIs wired; realtime updates confirmed via RealtimeProvider; server hydration added.
- [x] /admin/reports: StandardPage with export buttons calling /api/admin/export verified.
- [x] /admin/clients/profiles: ListPage + AdvancedDataTable verified (≤50 rows/page). Export-by-filters pending.
- [ ] Next: Adopt AnalyticsPage template on /admin/analytics; implement calendar interactions (drag-to-reschedule, availability toggle); add filtered export on clients/profiles.

## Hotfix – 2025-09-28 (Build failure: next/dynamic in Server Component)
- [x] Removed next/dynamic with ssr:false in src/app/admin/page.tsx; statically imported AdminOverview; build passes.

## Hotfix – 2025-09-29 (CSP/CORS and cross-origin API base)
- [x] Updated next.config.mjs CSP connect-src to include https://*.vercel.app and https://*.vercel.com (Report-Only) to match preview domains.
- [x] Hardened client apiFetch to ignore NEXT_PUBLIC_API_BASE when cross-origin; enforces same-origin calls across deploys to avoid CORS/CSP violations; preserves retry/safe fallback.
- [x] Added @playwright/test to devDependencies to fix Netlify E2E plugin resolution.

## Hotfix – 2025-09-29 (RBAC permission typing)
- [x] Fixed TS2345 by using PERMISSIONS.TEAM_MANAGE in src/app/admin/calendar/page.tsx and importing PERMISSIONS.

## Hotfix – 2025-09-29 (Availability page import)
- [x] Added missing StandardPage import to src/app/admin/availability/page.tsx.

## Progress Update – 2025-09-29
- [x] Security policies: CSP connect-src aligned for Netlify/Vercel previews; CORS issues mitigated by same-origin fetch strategy.
- [ ] Verify admin pages with direct fetch() still use relative paths; add guards if any server component can throw on failed fetch.
- [x] /admin/analytics adopted AnalyticsPage and added CSV export action via AdminAnalyticsPageClient.
- [x] /admin/calendar: implemented click-to-create, drag-to-reschedule (PATCH /api/admin/bookings), and availability toggle (PUT /api/admin/availability-slots); API updated to include serviceId/teamMemberId.
- [x] /admin/clients/profiles: URL sync for q/tier/sort/page; export respects active filters.

---

## Autonomous Hotfixes — 2025-09-29 (Applied by automated developer agent)

- [x] Fixed duplicate StandardPage import in src/app/admin/availability/page.tsx
  - Why: Build error TS2300 (Duplicate identifier 'StandardPage') occurred because the file imported StandardPage twice. This was an existing code issue and required a simple cleanup (removal of repeated import).
  - Type: Enhancement / cleanup of existing code
  - Files changed: src/app/admin/availability/page.tsx
  - Next steps: Run TypeScript typecheck and CI build to confirm no further references cause duplication.

- [x] Fixed Zod Step7Schema gdprConsent literal misuse in src/app/admin/clients/new/page.tsx
  - Why: TypeScript reported a Zod overload mismatch; z.literal was called with an options object using errorMap, which isn't valid for this z.literal overload. Replaced the options to use the correct message property to provide the error text.
  - Type: Bugfix (validation schema)
  - Files changed: src/app/admin/clients/new/page.tsx
  - Next steps: Verify runtime validation behavior in the browser and run unit tests that reference this form validation.

- [x] Fixed authOptions import in src/app/api/auth/register/register/route.ts
  - Why: The register route imported authOptions from the auth nextauth route file, but that file does not export authOptions — causing TS2459. Using the canonical source of authOptions at '@/lib/auth' fixes the issue and aligns all server-side code to the same auth config.
  - Type: Bugfix / refactor (use canonical export)
  - Files changed: src/app/api/auth/register/register/route.ts
  - Next steps: Run TypeScript typecheck and exercise the registration route to confirm getServerSession(authOptions) returns as expected under server tests.

## Hotfix – 2025-09-30 (Newsletter RowAction typing and disabled handling)
- [x] Added optional `disabled` to RowAction<T> and taught DataTable to honor it
  - Why: Build failed (TS2353) on /admin/newsletter because 'disabled' was not part of RowAction<Subscription>; UI relied on conditional disabling for Unsubscribe
  - Type: Bugfix (typing + UI behavior)
  - Files changed:
    - src/types/dashboard.ts (RowAction<T> now supports `disabled?: boolean | ((row: T) => boolean)`)
    - src/components/dashboard/DataTable.tsx (buttons render with disabled state and prevent clicks)
  - Verify:
    - Typecheck passes
    - In Newsletter list, Unsubscribe is disabled for inactive rows and enabled for active rows
    - No visual regressions to table actions

## Next Actions (automated)
- [ ] Run full TypeScript typecheck and fix remaining errors (in progress)
  - Why: Ensure compile-time errors are resolved across the repo.
  - How: Run `pnpm -s exec tsc --noEmit -p tsconfig.build.json`, iterate on any reported issues.

- [ ] Run `pnpm vercel:build` and confirm CI passes (pending)
  - Why: Full build verifies SSR behavior, Prisma generation, and production compile-time checks.
  - How: Run `pnpm vercel:build` after typecheck success; review logs and fix failures.
  - Status: Attempted locally with `pnpm build:skip-env`; build tool aborted due to environment timeout. Next: trigger CI build by pushing changes or run locally with extended timeout and share logs.

- [ ] Add/adjust unit tests for fixed validation logic and registration flow
  - Why: Prevent regressions and ensure schema/endpoint behavior remains stable.
  - How: Add Vitest unit tests for Step7Schema and the register route.

- [ ] Manual/automated QA: exercise Add Client form end-to-end and admin availability page
  - Why: Confirm UI-level behavior, error messages, and redirects.
  - How: Use the existing Playwright config and test suite. Add new e2e checks if necessary.

---

## Change Log (quick scan)
- Files edited during this pass:
  - src/app/admin/availability/page.tsx (duplicate import removed)
  - src/app/admin/clients/new/page.tsx (Zod literal options corrected)
  - src/app/api/auth/register/register/route.ts (import authOptions from '@/lib/auth')
  - src/app/api/admin/export/route.ts (added exports for newsletter, posts, and payments)
  - src/app/admin/posts/page.tsx (wired Export CSV action)
  - src/app/admin/payments/page.tsx (added Export CSV action)






## Hotfix – 2025-09-30 (Admin footer optimization)
- [x] Compact admin footer and remove unimplemented links
  - Why: The admin footer previously exposed many secondary links (Logs, Documentation, API Reference, Support Tickets) that did not have corresponding routes or were not yet implemented, increasing cognitive load and maintenance. The footer was also visually large and duplicated system details.
  - Type: Enhancement / cleanup
  - Files changed: src/components/admin/layout/AdminFooter.tsx
  - What changed:
    - Replaced verbose multi-column layout with a compact single-row footer.
    - Kept essential links only: Analytics, Settings, Main Site.
    - Reduced visual weight: smaller font-size, compact icons, minimal status indicator.
    - Removed links to unimplemented pages (/admin/logs, /admin/docs, /admin/api-docs, /admin/support) to avoid broken navigation.
  - Next steps: If those features are implemented later, re-introduce them conservatively and ensure tests cover the routes.


## Hotfix – 2025-09-30 (Cron Telemetry navigation IA)
- [x] Move Cron Telemetry from top navigation dropdown to Admin Sidebar > System
  - Why: Improves information architecture; system tools belong under Admin sidebar.
  - Type: Enhancement / IA adjustment
  - Files changed:
    - src/components/ui/navigation.tsx (removed Cron Telemetry entries; cleaned import)
    - src/components/admin/layout/AdminSidebar.tsx (added Cron Telemetry under System with Clock icon)
  - Tests: Updated tests/navigation.links.test.ts to assert presence in AdminSidebar instead of top nav
  - Next steps: Verify visual in admin layout; ensure RBAC consistent with other system items.

## Hotfix – 2025-09-30 (Service Requests page build)
- [x] Mark /admin/service-requests/page.tsx as client component
  - Why: Page uses useState/useEffect; Next.js App Router requires 'use client'.
  - Type: Bugfix
  - Files changed: src/app/admin/service-requests/page.tsx ('use client' directive added)
  - Next steps: Continue implementing realtime SSE and bulk endpoints per spec under /api/admin/service-requests/*.

## Hotfix – 2025-09-30 (Service Requests filters typing)
- [x] Fixed TS2322 in ClientPage by aligning RequestFilters types with useServiceRequests unions
  - Why: filters.status and filters.priority were typed as string causing mismatch when passed to useServiceRequests expecting strict unions. Narrowed types to ServiceRequestStatus/ServiceRequestPriority.
  - Type: Bugfix (typing)
  - Files changed: src/components/admin/service-requests/filters.tsx
  - Next steps: Run typecheck and vercel:build; verify URL-initialized filters still narrow correctly and CSV export works.

## Progress Update – 2025-09-30 (Admin tasks)
- [x] /admin/payments: Added status/method/date filters with URL sync and CSV export hooks
  - Why: Complete filtering UX per spec; reuse existing ListPage; maintain styles
  - Type: Enhancement (wired existing template features)
  - Files changed: src/app/admin/payments/page.tsx
- [x] /admin/tasks: Enabled Board/List/Table/Calendar/Gantt views and wired notifications settings to API
  - Why: Leverage existing rich components; expose Export & Templates panel storing notifications via /api/admin/tasks/notifications
  - Type: Enhancement (reuse, no new UI styles)
  - Files changed: src/app/admin/tasks/page.tsx, src/app/admin/tasks/components/export/ExportPanel.tsx
- [x] /admin/posts: Enforced RBAC and fixed client directive
  - Why: Page uses hooks; needed 'use client'. Added PermissionGate to restrict access
  - Type: Enhancement/bugfix (no UX change)
  - Files changed: src/app/admin/posts/page.tsx
  - Next steps: Optional – adopt ListPage and hook into /api/admin/stats/posts for KPI tiles

## Hotfix – 2025-09-30 (RBAC gating on missing admin pages)
- [x] Enforced RBAC on /admin/expenses, /admin/integrations, /admin/team, /admin/settings, /admin/security
  - Why: Ensure only authorized roles can access these pages according to the existing permission model; aligns with P0 RBAC enforcement.
  - Type: Enhancement (RBAC enforcement)
  - Files changed:
    - src/app/admin/expenses/page.tsx
    - src/app/admin/integrations/page.tsx
    - src/app/admin/team/page.tsx
    - src/app/admin/settings/page.tsx
    - src/app/admin/security/page.tsx
  - Next steps: Finalize permission matrix for Financial and System modules; add DOM/unit tests asserting PermissionGate fallbacks and server RBAC for API routes.

## Hotfix – 2025-09-30 (Realtime event contracts centralization)
- [x] Added src/lib/realtime-events.ts exporting AdminRealtimeEventType and payload contracts for core events
  - Why: Establishes a single source of truth for event names and payload shapes; reduces drift across pages and APIs.
  - Type: Documentation-as-code / typing
  - Files added: src/lib/realtime-events.ts
  - Next steps: Incrementally adopt types in RealtimeProvider consumers and API broadcasters; add unit tests for parseEventMessage using contracts.

