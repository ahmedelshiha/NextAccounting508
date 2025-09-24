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
- [ ] Validate ./dashboard-structure.md code blocks compile as-is
- [ ] Cross-check naming/props against ./quickbooks_dashboard_complete.md
- [ ] Note extension points (adding nav items, columns, filters) and migration notes
  - Acceptance: docs reflect final IA and component APIs; examples compile in isolation

## Phase 2 – Information Architecture (IA)
- [x] Define grouped nav for accounting + booking system
  - [ ] Clients → Client List, Invitations, Profiles
  - [ ] Bookings → Appointments, Services, Availability, Booking Settings
  - [ ] Accounting → Invoices, Payments, Expenses, Reports, Taxes
  - [ ] Team → Staff, Roles, Permissions
  - [ ] System → Settings, Notifications, Integrations
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
- [ ] Wire tabs + filters to existing hooks
  - [x] Bookings/Service Requests → useBookings + FilterBar/DataTable
  - [x] Clients → use SWR to /api/admin/users + FilterBar/DataTable
- [x] Services → use SWR to /api/admin/services + FilterBar/DataTable
- [x] Tasks → use TaskProvider or /api/admin/tasks + FilterBar/DataTable
- [ ] Ensure DataTable columns/data match current models (id, client, service, status, revenue)
  - [x] Bookings/Service Requests: added ID, Status, Payment (status+amount), Date from scheduledAt/createdAt; revenue derived from paymentAmountCents or service.price
  - [x] Clients: columns id, name, email, role, status, createdAt
  - [x] Services: columns id, name, category, price, status, updatedAt
  - [x] Tasks: columns id, title, assignee, status, dueAt
- [ ] Add batch actions (export/cancel/assign) where selection is enabled
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
- [ ] Avoid layout shift; use skeleton states in tables/cards
- [ ] Memoize heavy render paths where needed
- [x] Run lint/typecheck/tests: pnpm lint, pnpm typecheck, pnpm test:thresholds
- [ ] Validate no CLS/contrast regressions (QuickBooks green #2CA01C as accent)

## Phase 8 – Docs & Handoff
- [ ] Validate ./dashboard-structure.md code blocks compile as-is when placed into paths
- [ ] Cross-check naming/props against ./quickbooks_dashboard_complete.md
- [ ] Note extension points (adding nav items, columns, filters)
- [ ] Record migration notes for any route reorganizations

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
- [x] Why it was done
  - Complete Phase 5 wiring for Clients/Services/Tasks and meet measurable acceptance criteria
  - Improve accessibility feedback without altering existing visual styles
- [x] Next steps
  - Localize new UI strings (en/ar/hi) and add memoization for heavy cells
  - Run pnpm lint, pnpm typecheck, pnpm test:thresholds and address issues
  - Update dashboard-structure.md examples where necessary

## Doc Sync Tasks (keep in sync as work progresses)
- [ ] When a component changes, update the corresponding block in ./dashboard-structure.md
- [ ] If IA changes, update the Sidebar section in both ./quickbooks_dashboard_complete.md and ./dashboard-structure.md
- [ ] Capture deviations from spec in this TODO with rationale and link to commit

---

## Portal Audit – Action Items (pre-coding)
Source: Client Portal Audit (user-provided)

### Navigation & IA
- [ ] Align labels: “Service Requests�� vs “Appointments/Bookings” across UI and filters
  - Acceptance: identical wording in portal pages and query param names; no mixed terms in UI strings
- [ ] Add shared filter components to reduce duplication between admin and portal
  - Acceptance: portal pages use src/components/dashboard/FilterBar.tsx or a shared variant without regressions

### Access Control & Security
- [ ] Enforce ownership/tenant on booking cancellation (DELETE /api/bookings/:id)
  - Acceptance: request rejected when session.user.id doesn’t own booking or tenantId mismatch; tests cover both
- [ ] Confirm all /api/portal/** routes check getServerSession + client ownership
  - Acceptance: negative tests for cross-user access return 403/404 consistently
- [ ] Add 405 handling to all portal route handlers for unsupported methods
  - Acceptance: OPTIONS/PUT/etc. on GET-only routes return 405 with Allow header

### Realtime (WS/SSE)
- [ ] Create portal-specific notifications hook backed by /api/portal/realtime
  - Acceptance: useClientNotifications no longer connects to /api/admin/realtime from portal; events rendered in UI
- [ ] Decide SSE naming: keep /api/portal/realtime and restrict /api/admin/realtime to admin, or expose shared /api/realtime
  - Acceptance: doc updated; code uses the chosen endpoint; rate limits unchanged
- [ ] Log SSE connection counts and errors with route tags
  - Acceptance: events visible via src/app/api/health/logs/route.ts output

### Notifications & Chat
- [ ] LiveChatWidget uses /api/portal/chat and /api/portal/realtime (chat-message); supports offline queue
  - Acceptance: sending while offline enqueues and flushes on reconnect; badge count updates

### Booking UX
- [ ] Portal dashboard page.tsx supports cancel + CSV export; verify query filters in useBookings scope 'portal'
  - Acceptance: cancel calls mutate cache; export respects current filters
- [ ] ServiceRequestsClient tabs (all/requests/appointments) map to back-end type filters
  - Acceptance: URL params reflect current tab; API returns filtered data

### Preferences (Settings)
- [ ] GET/PUT /api/portal/settings/booking-preferences connected to settings page
  - Acceptance: zod-validated form; optimistic update with rollback on error

### Offline/PWA
- [ ] Ensure OfflineQueueInspector works with IndexedDB “af-offline”; SW background sync flush
  - Acceptance: create SR offline, verify it flushes and UI reflects success after reconnect

### API & Schemas
- [ ] Export zod schemas/types for portal client consumption
  - Acceptance: shared types imported in portal components; type-safe api client created
- [ ] Enforce pagination caps and document cursor pagination option for large data
  - Acceptance: page size > max is clamped; API returns warning meta field

### Testing
- [ ] Unit: zod validators and owner/tenant guards for all portal routes
- [ ] Integration: create SR/booking, comments, confirm/reschedule happy-path
- [ ] E2E (Playwright): filters, pagination, CSV export, offline queue, chat send/receive
  - Acceptance: green test suite; documented in CI job

### Observability & Performance
- [ ] Add debounce for client CSV generation for large datasets
  - Acceptance: 500+ rows export without UI stutter
- [ ] Ensure realtime errors captured with route labels (lib/observability)
  - Acceptance: errors visible with correct tags in logs

### A11y & i18n
- [ ] Apply existing locales under src/app/locales/* to portal UI strings; ensure aria labels present
  - Acceptance: en/ar/hi keys added where strings exist; basic keyboard nav works across controls

### Integration & Shared Modules
- [ ] Consolidate availability/pricing adapters behind shared facade with clear error surfaces
  - Acceptance: both portal and admin use the adapter; errors rendered consistently

References
- Portal pages: src/app/portal/*
- Portal APIs: src/app/api/portal/*
- Portal components: src/components/portal/*
- Hooks: src/hooks/useBookings.ts, src/hooks/useBookingsSocket.ts, src/hooks/useRealtime.ts, src/hooks/useClientNotifications.ts
- Middleware/guards: src/middleware.ts, src/lib/auth.ts, src/lib/tenant.ts, src/lib/permissions.ts
