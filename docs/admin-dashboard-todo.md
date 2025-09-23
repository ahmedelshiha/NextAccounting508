# Admin Dashboard – QuickBooks-Style Transformation TODO

Status legend: [ ] pending, [x] done, (→) owner/actionable note

## Linked Specifications (authoritative sources)
- [ ] Review and align with QuickBooks dashboard plan: ./quickbooks_dashboard_complete.md
- [ ] Implement using the component blueprints: ./dashboard-structure.md

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
- [ ] Read ./quickbooks_dashboard_complete.md and extract UI + IA requirements
- [ ] Confirm Tailwind v4 utilities and existing shadcn components usage (Button, Card, etc.)
- [ ] Identify any blocking tech constraints (Next.js app router, auth, i18n)

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
