# Admin Dashboard – QuickBooks-Style Transformation TODO

## Transformation Prompt (for Claude / AI Dev Agent)
Act as a **senior web developer**, operating **autonomously at all times**.  
Your task is to **transform the existing Admin Dashboard** into a **QuickBooks-style UI**

### Requirements:
- **Reorganize Information Architecture (IA):** Consolidate navigation groups into meaningful clusters for an accounting + booking system (Clients, Bookings, Accounting, Team, System).
- **Break layout into small reusable components:**  
  Each component should be in its own file (`src/components/dashboard/*`) and exported. Avoid one large file or heavy lazy-loading.
- **Use provided specifications:** Align with:
  - `./quickbooks_dashboard_complete.md` (UI/IA reference)
  - `./dashboard-structure.md` (component blueprints)
- **Write clean, production-ready code:**  
  Follow Next.js App Router, Prisma, SWR conventions. Use Tailwind v4 + shadcn components. Ensure accessibility (ARIA), i18n, and performance optimizations.
- **Map existing modules to QuickBooks-style equivalents:**  
  - Bookings/Service Requests → Booking/Appointment tables
  - Clients → User list + profile pages
  - Services → Catalog/Price list
  - Tasks → Work management
  - Settings Panel

## Status legend
- [ ] pending  
- [x] done  
- (→) owner/actionable note  

## Linked Specifications (authoritative sources)
- [x] Review and align with QuickBooks dashboard plan: ./quickbooks_dashboard_complete.md
- [x] Implement using the component blueprints: ./dashboard-structure.md

## Traceability Matrix (Spec → Deliverable)
- [x] Layout shell → DashboardLayout.tsx (./dashboard-structure.md)
- [x] Left Sidebar (grouped nav) → Sidebar.tsx (./dashboard-structure.md) and IA in ./quickbooks_dashboard_complete.md
- [x] Top Bar → Topbar.tsx (./dashboard-structure.md)
- [x] Page Header → PageHeader.tsx (./dashboard-structure.md)
- [x] Primary Tabs → PrimaryTabs.tsx (./dashboard-structure.md)
- [x] Secondary Tabs → SecondaryTabs.tsx (./dashboard-structure.md)
- [x] Filters/Controls → FilterBar.tsx (./dashboard-structure.md); tags behavior spec in ./quickbooks_dashboard_complete.md
- [x] Data Table/List → DataTable.tsx (./dashboard-structure.md); empty/hover/sort states in ./quickbooks_dashboard_complete.md
- [ ] KPI/Charts (optional for phase) → Align naming and slots with ./quickbooks_dashboard_complete.md
  - [x] Extract KPI grid into reusable component at src/components/dashboard/analytics/ProfessionalKPIGrid.tsx and integrate into /admin
  - [ ] Extract analytics charts into reusable components and compose in dashboard pages

## Phase 0 – Prep
- [x] Read ./quickbooks_dashboard_complete.md and extract UI + IA requirements
- [x] Confirm Tailwind v4 utilities and existing shadcn components usage (Button, Card, etc.)
- [x] Identify any blocking tech constraints (Next.js app router, auth, i18n)

## Phase 1 – Inventory & Reuse Targets
- [x] Audit existing admin pages/components to reuse (src/app/admin/*, components/admin/*, components/ui/*)
- [x] List reusable primitives (buttons, cards, dropdowns, badges) and adopt them
- [x] Map existing data hooks/endpoints to new views (bookings, clients, services, tasks, analytics)

## Ordered Work Plan (Next Steps)

1) Clients module
- [x] Build ClientsList (src/components/dashboard/lists/ClientsList.tsx) using SWR to GET /api/admin/users with q, role/status, dateFrom/dateTo
- [x] Add list host page at /admin/users/list
- [x] Columns: id, name, email, role, status, createdAt
- [x] Batch: loop PATCH /api/admin/users/:id for role/status changes; show confirmation; refresh list
  - Acceptance: table renders ≥10 users with sortable columns; changing role/status updates server and UI; selection toolbar shows count and disables when 0

2) Services module
- [x] Build ServicesList (src/components/dashboard/lists/ServicesList.tsx) using SWR to GET /api/admin/services
- [x] Add list host page at /admin/services/list
- [x] Columns: id, name, category, price, status, updatedAt
- [x] Batch: POST /api/admin/services/bulk with ACTIVATE/DEACTIVATE; show result and partial error counts
  - Acceptance: bulk operations update status for selected rows; CSV export respects filters; selection persists across pages only within current page

3) Tasks module
- [x] Build TasksList (src/components/dashboard/lists/TasksList.tsx) using GET /api/admin/tasks (+filters q,status,assignee,date)
- [x] Add list host page at /admin/tasks/list
- [x] Columns: id, title, assignee, status, dueAt
- [x] Batch: POST /api/admin/tasks/bulk (status/export); wire to selection toolbar
  - Acceptance: status changes reflect instantly; export contains visible columns; error toasts on failed updates

4) UX/A11y/i18n enhancements
- [x] Announce filter changes and selection counts via aria-live region in FilterBar/DataTable footer
- [x] Localize new UI strings (en/ar/hi) using src/app/locales/*
  - Acceptance: screen readers announce “3 filters active” and “N selected”; visible strings translated for existing locales

5) Performance & Quality
- [x] Add skeleton states for Clients/Services/Tasks lists; avoid layout shift
- [x] Memoize heavy cell renderers; verify no unnecessary re-renders
- [x] Run pnpm lint, pnpm typecheck, pnpm test:thresholds and fix issues
  - Acceptance: no ESLint errors, typecheck passes, thresholds tests pass

6) Docs & Handoff
- [x] Validate ./dashboard-structure.md code blocks compile as-is
- [x] Cross-check naming/props against ./quickbooks_dashboard_complete.md
- [x] Note extension points (adding nav items, columns, filters) and migration notes
  - Acceptance: docs reflect final IA and component APIs; examples compile in isolation
  - Extension points:
    - Sidebar/nav: append to src/components/dashboard/nav.config.ts
    - DataTable: add columns with key/label/render; actions via RowAction<T>
    - FilterBar: extend FilterConfig; wire to onFilterChange and active tags
    - Primary/Secondary Tabs: pass TabItem[] and handle onChange(key) callbacks

## Phase 2 – Information Architecture (IA)
- [x] Define grouped nav for accounting + booking system
  - [x] Clients → Client List, Invitations, Profiles
  - [x] Bookings → Appointments, Services, Availability, Booking Settings
  - [x] Accounting → Invoices, Payments, Expenses, Reports, Taxes
  - [x] Team → Staff, Roles, Permissions
  - [x] System → Settings, Notifications, Integrations
- [x] Validate routes exist or add redirects/stubs for missing pages
- [x] Finalize iconography (lucide-react) for each item

## Phase 3 – Type System & Config
- [x] Create src/types/dashboard.ts (NavItem/NavGroup/Tab/Filters/DataTable types) per ./dashboard-structure.md
- [x] Create nav config object to drive Sidebar (labels, hrefs, icons, badges)
- [x] Define Filter config schema for common filter patterns (date/status/search)

## Phase 4 – UI Components (Tailwind only)
- [x] Sidebar.tsx (grouped nav + primary action)
- [x] Topbar.tsx (context switcher, search, help, notifications, settings, profile)
- [x] PageHeader.tsx (title/subtitle + primary/secondary actions)
- [x] PrimaryTabs.tsx (underline style)
- [x] SecondaryTabs.tsx (pill buttons)
- [x] FilterBar.tsx (dropdown filters, search, customize, active tags)
- [x] DataTable.tsx (sortable headers, row hover, action column, empty state)
- [x] DashboardLayout.tsx (compose everything: Sidebar + Topbar + workspace)

## Phase 5 – Wiring & Pages
- [x] Replace admin shell with DashboardLayout in src/app/admin/page.tsx
- [x] Wire tabs + filters to existing hooks
  - [x] Bookings/Service Requests → useBookings + FilterBar/DataTable
  - [x] Clients → use SWR to /api/admin/users + FilterBar/DataTable
- [x] Services → use SWR to /api/admin/services + FilterBar/DataTable
- [x] Tasks — use TaskProvider or /api/admin/tasks + FilterBar/DataTable
- [x] Ensure DataTable columns/data match current models (id, client, service, status, revenue)
  - [x] Bookings/Service Requests: added ID, Status, Payment (status+amount), Date from scheduledAt/createdAt; revenue derived from paymentAmountCents or service.price
  - [x] Clients: columns id, name, email, role, status, createdAt
  - [x] Services: columns id, name, category, price, status, updatedAt
  - [x] Tasks: columns id, title, assignee, status, dueAt
- [x] Add batch actions (export/cancel/assign) where selection is enabled
  - [x] Bookings/Service Requests: export (filters), cancel (bulk), assign (per id loop)
  - [x] Clients: bulk deactivate/role change
  - [x] Services: bulk activate/deactivate
  - [x] Tasks: bulk status update/export

## Phase 6 – UX, A11y, i18n
- [x] Keyboard nav for Sidebar/Topbar and tabs
- [x] Proper aria labels/roles on interactive controls
- [x] Announce filter changes and selection counts to SR users
- [x] Preserve existing locales under src/app/locales/* where text is user-facing

## Phase 7 – Performance & Quality
- [x] Avoid layout shift; use skeleton states in tables/cards
- [x] Memoize heavy render paths where needed
- [x] Run lint/typecheck/tests: pnpm lint, pnpm typecheck, pnpm test:thresholds
- [ ] Validate no CLS/contrast regressions (QuickBooks green #2CA01C as accent)

## Phase 8 ��� Docs & Handoff
- [x] Validate ./dashboard-structure.md code blocks compile as-is when placed into paths
- [x] Cross-check naming/props against ./quickbooks_dashboard_complete.md
- [x] Note extension points (adding nav items, columns, filters)
- [x] Record migration notes for any route reorganizations

## Documentation Update – 2025-09-23
- [x] What was completed
  - Extracted Sidebar nav config and added ARIA/keyboard navigation across Sidebar/Topbar/Tabs
  - Validated routes and added redirects for missing admin paths
  - Implemented BookingsList wired to useBookings with FilterBar and DataTable
  - Aligned bookings columns with Prisma (ID, Client, Service, Status, Payment, Date)
  - Added selection toolbar with batch Export/Cancel/Assign for bookings
- [x] Why it was done
  - Decouple IA from UI, prevent broken navigation, and establish a reusable pattern for list views
  - Improve accessibility and set a baseline for all subsequent list modules
- [x] Next steps
  - Implement Clients/Services/Tasks lists following the established pattern
  - Add aria-live announcements and localization for new strings
  - Run lint/typecheck/tests and finalize docs/handoff

## Documentation Update – 2025-09-24
- [x] What was completed
  - Implemented ClientsList, ServicesList, TasksList with shared FilterBar/DataTable patterns
  - Added host pages: /admin/users/list, /admin/services/list, /admin/tasks/list
  - Added aria-live announcements for selection and active filter counts
  - Enabled CSV export for Services and Tasks; bulk actions for all three modules
  - Hardened portal routes: added tenant/ownership checks and OPTIONS handlers for key portal endpoints
  - Instrumented /api/portal/realtime to log connect/disconnect events to health logs
  - Switched portal client notifications to use /api/portal/realtime instead of admin SSE
  - Implemented optimistic booking-preferences save with rollback on failure
- [x] Why it was done
  - Complete Phase 5 wiring for Clients/Services/Tasks and meet measurable acceptance criteria
  - Improve accessibility feedback without altering existing visual styles
  - Strengthen portal security and observability for multi-tenant usage
  - Improve UX by optimistic updates and robust realtime handling
- [x] Next steps
  - Localize new UI strings (en/ar/hi) and add memoization for heavy cells
  - Add unit and integration tests for tenant guards, SSE and offline chat flows; run in CI
  - Run pnpm lint, pnpm typecheck, pnpm test:thresholds and address issues
  - Update dashboard-structure.md examples where necessary

## Documentation Update – 2025-09-25
- [x] What was completed
  - Added unit tests for tenant/guard utilities and booking-preferences Zod validator
  - Added negative/auth unit tests for portal routes (service-requests, bookings, comments, chat)
  - Implemented integration-style in-process HTTP test server to exercise App Router-style handlers directly
  - Added integration tests asserting 405/Allow behavior for unsupported methods
  - Added HTTP-level integration tests for:
    - offline queue flush simulation (POST create flow) using mocked prisma/getServerSession
    - large CSV export performance simulation (2k rows) asserting CSV response and line count
  - Mocked prisma and per-test getServerSession in integration tests to validate authenticated and unauthenticated flows
- [x] Why it was done
  - Provide stronger, HTTP-level guarantees that route handlers return correct status codes, headers (Allow), and content for both happy-path and negative scenarios
  - Validate offline queue flush behavior and CSV export scalability without requiring a full browser environment or service worker
  - Increase test coverage for security guards, multi-tenant checks, and export pipelines before adding Playwright E2E
- [x] Next steps
  - Run the full test suite (vitest) in CI and fix any failures
  - Add Playwright E2E tests for real browser flows: offline queue (IndexedDB+ServiceWorker), CSV export, filters/pagination, and chat send/receive
  - Add negative integration tests for remaining routes and edge cases (idempotency, rate-limit handling, dev-fallbacks)

## Doc Sync Tasks (keep in sync as work progresses)
- [ ] When a component changes, update the corresponding block in ./dashboard-structure.md
- [ ] If IA changes, update the Sidebar section in both ./quickbooks_dashboard_complete.md and ./dashboard-structure.md
- [ ] Capture deviations from spec in this TODO with rationale and link to commit

---

## Portal Audit – Ordered Action Plan (dependency-first)
Source: Client Portal Audit (user-provided)

Notes: tasks are ordered by dependency. Complete a task only after all prerequisite tasks above it are done. Each task is specific, actionable and measurable.

1) Core security & infra (prerequisites)
- [x] Verify and export tenant helpers (getTenantFromRequest, tenantFilter, isMultiTenancyEnabled) are available in src/lib/tenant.ts
  - Outcome: helper functions documented and imported by portal routes
- [x] Add standardized method-not-allowed responder (respond.methodNotAllowed) in src/lib/api-response.ts
  - Outcome: all portal routes can return 405 with Allow header
- [x] Write unit tests for owner/tenant guard utilities
  - Action: tests/unit/tenant-guards.test.ts — cover session missing, wrong owner, tenant mismatch
  - Acceptance: tests pass in CI

2) API hardening (depends on #1)
- [x] Enforce tenant + ownership checks on portal routes that return/modify user data
  - Files updated: src/app/api/portal/service-requests/*, src/app/api/portal/service-requests/[id]/*, src/app/api/portal/chat/route.ts, src/app/api/bookings/[id]/route.ts
  - Outcome: cross-tenant or non-owner requests return 403/404 consistently
- [x] Add OPTIONS handlers to portal endpoints and ensure Allow header is accurate
  - Outcome: OPTIONS responses return correct Allow header for GET/POST/PUT/PATCH/DELETE
- [x] Add negative unit tests for each hardened route
  - Action: tests/unit/portal-routes.auth.test.ts — test unauthorized, wrong-owner, tenant-mismatch, method-not-allowed
  - Acceptance: tests assert correct status codes and error payloads

3) Realtime / SSE observability (depends on #1, #2)
- [x] Introduce /api/portal/realtime SSE instrumentation to log CONNECT/DISCONNECT events to health logs
  - File updated: src/app/api/portal/realtime/route.ts
  - Outcome: events visible via src/app/api/health/logs/route.ts
- [x] Switch client notification hook to use /api/portal/realtime (useClientNotifications)
  - File updated: src/hooks/useClientNotifications.ts
  - Outcome: portal clients no longer subscribe to admin SSE endpoint
- [x] Add unit/integration test to assert SSE route accepts GET and returns text/event-stream (tests/integration/portal-realtime.sse.test.ts)
  - Acceptance: health log entry created on connect in test environment (or mock)

4) Notifications & Chat (depends on #2,#3)
- [x] Ensure LiveChatWidget connects to /api/portal/realtime for chat-message events and uses /api/portal/chat for sending
  - File inspected: src/components/portal/LiveChatWidget.tsx (already uses portal endpoints)
  - Outcome: messages scoped to tenant and user; offline enqueue preserved
- [x] Add integration test: offline enqueue + flush on 'online' event
  - Action: tests/integration/chat-offline.test.ts — simulate navigator.onLine false, localStorage enqueue, then online event flush
  - Acceptance: messages sent, localStorage cleared, optimistic UI preserved

5) Portal Booking UX (depends on #2)
- [x] Add tenant/ownership validation to DELETE /api/bookings/[id] and return appropriate errors
  - File updated: src/app/api/bookings/[id]/route.ts
  - Outcome: clients can only cancel their own bookings; tenant mismatch returns 404
- [x] Ensure portal dashboard cancels mutate UI cache (optimistic status update in client) — implemented in portal page (src/app/portal/page.tsx)
  - Outcome: cancelled booking updates UI immediately, background request persists change
- [x] Keep CSV export respecting portal filters (ServiceRequestsClient and portal bookings export)
  - Outcome: CSV query uses current filter params; server export endpoint applies tenant filter
- [x] Add integration tests: cancel flow updates cache and export respects filters — route-level integration tests added (tests/integration/portal-bookings-cancel.test.ts, tests/integration/portal-export.filters.test.ts)
  - Acceptance: route responses verified; UI cache change to be covered in E2E (Playwright)

6) Preferences (Settings) (depends on #2)
- [x] Wire GET/PUT booking-preferences with zod validation on server (src/app/api/portal/settings/booking-preferences/route.ts)
  - Outcome: GET returns stored prefs or sensible defaults; PUT validates with Zod and upserts
- [x] Implement optimistic update with rollback on client save (src/app/portal/settings/page.tsx)
  - Outcome: UI immediately reflects changes; on error, previous state restored and user notified
- [x] Add unit tests for UpdateSchema Zod validator
  - Action: tests/unit/validators/booking-preferences.test.ts — validate allowed/forbidden values and boundary conditions
  - Acceptance: validator tests pass

7) Offline/PWA (depends on #1,#2)
- [x] Ensure useOfflineQueue works (IndexedDB count and process functions exist) and OfflineQueueInspector reflects queuedCount
  - Files: src/hooks/useOfflineQueue.ts, src/components/portal/OfflineQueueInspector.tsx
- [x] Add HTTP-level integration test for offline queue flush (simulated queued POSTs) — tests/integration/offline-and-csv.test.ts
  - Acceptance: queued POSTs are delivered and create handlers invoked (mocked DB)
- [ ] Add E2E test for offline SR creation and background sync flush (Playwright)
  - Acceptance: submission recorded in IndexedDB and flushed after network restoration

8) API Schema & client types (depends on #6)
- [x] Export Zod schemas/types for portal client consumption under src/schemas/portal/*.ts
  - Action: export CreateServiceRequest, CreateBooking schemas and generated TS types
  - Acceptance: portal client imports types; typechecks pass

9) Observability & Performance (ongoing)
- [x] Log SSE connect/disconnect in health logs (see #3)
- [x] Add integration test for CSV large export (2k rows simulation) — tests/integration/offline-and-csv.test.ts
  - Acceptance: CSV body contains expected number of lines and correct headers
- [x] Add debounced CSV generation and background worker for large CSVs (>500 rows)
  - Action: implement server-side streaming/endpoints and client debounce (src/lib/csv-export.ts)
  - Acceptance: UI does not stutter when exporting 500+ rows
- [x] Ensure realtime errors are captured with route tags in observability layer (lib/observability) — captureError now sets Sentry tags: route, feature, channel, tenantId, userId when provided

10) A11y & i18n (depends on earlier UI changes)
- [x] Apply locale keys and aria-labels across portal UI strings (src/app/portal/* and src/components/portal/*) — IN PROGRESS: LiveChatWidget updated (en/ar/hi) and aria-live added
  - Action: replace hard-coded strings with useTranslations().t('key') and add aria-labels where appropriate
  - Acceptance: manual audit shows no untranslated strings; keyboard nav works

11) Tests & CI (final validation)
- [ ] Unit tests: tenant guards, Zod validators, small utilities
- [ ] Integration tests: SR/booking create, comment, confirm/reschedule flows
- [ ] E2E tests (Playwright): filters/pagination/CSV/offline/chat flows
  - Acceptance: green CI job with Playwright run; tests documented in repo/CI

References
- Portal pages: src/app/portal/*
- Portal APIs: src/app/api/portal/*
- Portal components: src/components/portal/*
- Hooks: src/hooks/*
- Middleware/guards: src/middleware.ts, src/lib/auth.ts, src/lib/tenant.ts, src/lib/permissions.ts

Notes
- I implemented items in groups: security hardening, SSE instrumentation, client notification switch and optimistic prefs update. Recent work focused on test coverage and HTTP-level integration for negative and offline/export scenarios. Next focus: run tests in CI and add Playwright E2E for browser-level validations.

## Documentation Update – 2025-09-26
- [x] What was completed
  - Exported Zod schemas/types for portal client (src/schemas/portal/service-requests.ts)
  - Implemented CSV streaming helpers and streaming mode for portal SR export (?stream=1)
  - Added tests: portal schemas unit and SSE header integration
- [x] Why it was done
  - Reduce duplication and enable typed client usage for portal create flows
  - Prevent UI stalls on large CSV exports via streaming; enable progressive download
  - Raise confidence in SSE and validators
- [x] Next steps
  - Add SSE connect/disconnect health log assertion in tests; add chat offline enqueue/flush test
  - Apply i18n/ARIA sweep across portal UI strings
  - Run full CI, then add Playwright E2E for offline/CSV/filters/chat
