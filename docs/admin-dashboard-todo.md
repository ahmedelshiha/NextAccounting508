# Admin Dashboard – QuickBooks-Style Transformation TODO

Status legend: [ ] pending, [x] done, (→) owner/actionable note

## Linked Specifications (authoritative sources)
- [x] Review and align with QuickBooks dashboard plan: ./quickbooks_dashboard_complete.md
- [x] Implement using the component blueprints: ./dashboard-structure.md

## Traceability Matrix (Spec → Deliverable)
- [ ] Layout shell → DashboardLayout.tsx (./dashboard-structure.md)
- [ ] Left Sidebar (grouped nav) → Sidebar.tsx (./dashboard-structure.md) and IA in ./quickbooks_dashboard_complete.md
- [ ] Top Bar → Topbar.tsx (./dashboard-structure.md)
- [ ] Page Header → PageHeader.tsx (./dashboard-structure.md)
- [ ] Primary Tabs → PrimaryTabs.tsx (./dashboard-structure.md)
- [ ] Secondary Tabs → SecondaryTabs.tsx (./dashboard-structure.md)
- [ ] Filters/Controls → FilterBar.tsx (./dashboard-structure.md); tags behavior spec in ./quickbooks_dashboard_complete.md
- [ ] Data Table/List → DataTable.tsx (./dashboard-structure.md); empty/hover/sort states in ./quickbooks_dashboard_complete.md
- [ ] KPI/Charts (optional for phase) → Align naming and slots with ./quickbooks_dashboard_complete.md

## Phase 0 – Prep
- [x] Read ./quickbooks_dashboard_complete.md and extract UI + IA requirements
- [x] Confirm Tailwind v4 utilities and existing shadcn components usage (Button, Card, etc.)
- [x] Identify any blocking tech constraints (Next.js app router, auth, i18n)

## Phase 1 – Inventory & Reuse Targets
- [ ] Audit existing admin pages/components to reuse (src/app/admin/*, components/admin/*, components/ui/*)
- [ ] List reusable primitives (buttons, cards, dropdowns, badges) and adopt them
- [ ] Map existing data hooks/endpoints to new views (bookings, clients, services, tasks, analytics)

## Phase 2 – Information Architecture (IA)
- [ ] Define grouped nav for accounting + booking system
  - [ ] Clients → Client List, Invitations, Profiles
  - [ ] Bookings → Appointments, Services, Availability, Booking Settings
  - [ ] Accounting → Invoices, Payments, Expenses, Reports, Taxes
  - [ ] Team → Staff, Roles, Permissions
  - [ ] System → Settings, Notifications, Integrations
- [ ] Validate routes exist or add redirects/stubs for missing pages
- [ ] Finalize iconography (lucide-react) for each item

## Phase 3 – Type System & Config
- [ ] Create src/types/dashboard.ts (NavItem/NavGroup/Tab/Filters/DataTable types) per ./dashboard-structure.md
- [ ] Create nav config object to drive Sidebar (labels, hrefs, icons, badges)
- [ ] Define Filter config schema for common filter patterns (date/status/search)

## Phase 4 – UI Components (Tailwind only)
- [ ] Sidebar.tsx (grouped nav + primary action)
- [ ] Topbar.tsx (context switcher, search, help, notifications, settings, profile)
- [ ] PageHeader.tsx (title/subtitle + primary/secondary actions)
- [ ] PrimaryTabs.tsx (underline style)
- [ ] SecondaryTabs.tsx (pill buttons)
- [ ] FilterBar.tsx (dropdown filters, search, customize, active tags)
- [ ] DataTable.tsx (sortable headers, row hover, action column, empty state)
- [ ] DashboardLayout.tsx (compose everything: Sidebar + Topbar + workspace)

## Phase 5 – Wiring & Pages
- [ ] Replace admin shell with DashboardLayout in src/app/admin/page.tsx
- [ ] Wire tabs + filters to existing hooks (bookings/clients/services/tasks)
- [ ] Ensure DataTable columns/data match current models (id, client, service, status, revenue)
- [ ] Add batch actions (export/cancel/assign) where selection is enabled

## Phase 6 – UX, A11y, i18n
- [ ] Keyboard nav for Sidebar/Topbar and tabs
- [ ] Proper aria labels/roles on interactive controls
- [ ] Announce filter changes and selection counts to SR users
- [ ] Preserve existing locales under src/app/locales/* where text is user-facing

## Phase 7 – Performance & Quality
- [ ] Avoid layout shift; use skeleton states in tables/cards
- [ ] Memoize heavy render paths where needed
- [ ] Run lint/typecheck/tests: pnpm lint, pnpm typecheck, pnpm test:thresholds
- [ ] Validate no CLS/contrast regressions (QuickBooks green #2CA01C as accent)

## Phase 8 – Docs & Handoff
- [ ] Validate ./dashboard-structure.md code blocks compile as-is when placed into paths
- [ ] Cross-check naming/props against ./quickbooks_dashboard_complete.md
- [ ] Note extension points (adding nav items, columns, filters)
- [ ] Record migration notes for any route reorganizations

## Doc Sync Tasks (keep in sync as work progresses)
- [ ] When a component changes, update the corresponding block in ./dashboard-structure.md
- [ ] If IA changes, update the Sidebar section in both ./quickbooks_dashboard_complete.md and ./dashboard-structure.md
- [ ] Capture deviations from spec in this TODO with rationale and link to commit

---

## Portal Audit – Action Items (pre-coding)
Source: Client Portal Audit (user-provided)

### Navigation & IA
- [ ] Align labels: “Service Requests” vs “Appointments/Bookings” across UI and filters
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
