# Admin Dashboard Audit (v2)

## Overview
- Purpose: A secure, multi-tenant back office for staff to manage services, bookings, tasks, clients, teams, financials (invoices/payments/expenses), content, analytics, and system settings.
- High-level features:
  - CRUD: services, bookings, tasks, service-requests, users/clients, team members, roles/permissions, price overrides.
  - Reporting & analytics: KPI dashboards, exports (CSV), real-time metrics, activity/audit views.
  - Financials: invoices, payments, expenses; export and sequence management.
  - Operations: availability slots, team management, reminders, uploads quarantine.
  - Settings: booking settings (steps, business-hours, payment-methods, import/export/reset), company/contact/timezone/financial, integrations.
  - Security: NextAuth session, RBAC via PERMISSIONS/ROLE_PERMISSIONS, route middleware, tenant scoping.
  - Integrations: Prisma/Postgres, Stripe, Redis (optional), Sentry, real-time channels.

---

## Complete Current Directory Structure
Legend: ✅ reusable/shared • ⚠️ duplicate/placeholder/suspicious

### src/app/admin
```
src/app/admin/
  layout.tsx ✅ (auth gated, RBAC redirect)
  layout-nuclear.tsx ⚠️ (legacy/alternate layout)
  page.tsx ✅ (overview shell)
  page-nuclear.tsx ⚠️ (legacy/alternate entry)
  page-simple.tsx ⚠️ (alternate entry)
  analytics/page.tsx ✅
  audits/page.tsx ✅
  availability/page.tsx ✅
  bookings/
    page.tsx ✅
    new/page.tsx ⚠️ (contains mock data for clients/services/team)
    [id]/page.tsx ✅
  calendar/page.tsx ✅
  chat/page.tsx ✅
  clients/
    page.tsx ✅
    new/page.tsx ✅
    invitations/page.tsx ✅
    profiles/page.tsx ✅
  compliance/page.tsx ✅
  cron-telemetry/page.tsx ✅
  expenses/page.tsx ✅
  integrations/page.tsx ✅
  invoices/
    page.tsx ✅
    sequences/page.tsx ✅
  newsletter/page.tsx ✅
  notifications/page.tsx ✅
  payments/page.tsx ✅
  perf-metrics/page.tsx ✅
  permissions/page.tsx ✅
  posts/page.tsx ✅
  previews/ ⚠️ (dev/demo preview pages)
    analytics/page.tsx ⚠️
    list/page.tsx ⚠️
    standard/page.tsx ⚠️
  reminders/page.tsx ✅
  reports/page.tsx ✅
  roles/page.tsx ✅
  security/page.tsx ✅
  service-requests/
    page.tsx ✅
    ClientPage.tsx ✅
    list/page.tsx ✅
    new/page.tsx ✅
    [id]/page.tsx ✅
    [id]/edit/page.tsx ✅
  services/
    page.tsx ✅
    list/page.tsx ✅
    [id]/page.tsx ✅
  settings/
    page.tsx ✅
    booking/page.tsx ✅
    company/page.tsx ✅
    contact/page.tsx ✅
    currencies/page.tsx ✅
    financial/page.tsx ✅
    timezone/page.tsx ✅
  tasks/
    page.tsx ✅
    list/page.tsx ✅
    new/page.tsx ✅
    new/TODO+log.md ⚠️
    TODO+log.md ⚠️
    data/
      notifications.json ✅
      templates.json ✅
      comments/1.json ✅
    hooks/
      useTaskActions.ts ✅
      useTaskAnalytics.ts ✅
      useTaskBulkActions.ts ✅
      useTaskFilters.ts ✅
      useTaskPermissions.tsx ✅
    providers/TaskProvider.tsx ✅
    schemas/task.ts ✅
    tests/ ⚠️ (tests colocated under app; valid but unusual)
      *.test.* ⚠️
  taxes/page.tsx ✅
  team/
    layout.tsx ✅
    page.tsx ✅
  uploads/quarantine/
    page.tsx ✅
    QuarantineClient.tsx ✅
  users/
    page.tsx ✅
    list/page.tsx ✅
```

### src/app/api/admin
```
src/app/api/admin/
  activity/route.ts ✅ (GET)
  analytics/route.ts ✅ (GET)
  availability-slots/route.ts ✅ (GET)
  auth/logout/route.ts ✅ (POST)
  booking-settings/
    route.ts ✅ (GET, PUT)
    business-hours/route.ts ✅ (PUT)
    export/route.ts ✅ (GET)
    import/route.ts ✅ (POST)
    payment-methods/route.ts ✅ (PUT)
    reset/route.ts ✅ (POST)
    steps/route.ts ✅ (PUT)
    validate/route.ts ✅ (POST)
  bookings/
    route.ts ✅ (GET, POST, PATCH, DELETE)
    [id]/migrate/route.ts ✅ (POST)
    pending-count/route.ts ✅ (GET)
    stats/route.ts ✅ (GET)
  calendar/route.ts ✅ (GET)
  chat/route.ts ✅ (GET, POST)
  currencies/
    route.ts ✅ (GET, POST)
    [code]/route.ts ✅ (PATCH)
    export/route.ts ✅ (GET)
    overrides/route.ts ✅ (GET, POST)
    refresh/route.ts ✅ (POST)
  expenses/route.ts ✅ (GET, POST, PATCH)
  export/route.ts ✅ (GET)
  health-history/route.ts ✅ (GET)
  invoices/
    route.ts ✅ (GET, POST, DELETE)
    [id]/pay/route.ts ✅ (POST)
  perf-metrics/route.ts ✅ (POST, GET:405)
  permissions/
    route.ts ✅ (GET)
    [userId]/route.ts ✅ (GET)
    roles/route.ts ✅ (GET)
  realtime/route.ts ✅ (GET)
  reminders/run/route.ts ✅ (GET)
  service-requests/
    route.ts ✅ (GET, POST)
    export/route.ts ✅ (GET)
    analytics/route.ts ✅ (GET)
    availability/route.ts ✅ (GET)
    bulk/route.ts ✅ (POST)
    pending-count/route.ts ✅ (GET)
    recurring/preview/route.ts ✅ (POST)
    [id]/
      route.ts ✅ (GET, PATCH, DELETE)
      assign/route.ts ✅ (POST)
      comments/route.ts ✅ (GET, POST)
      confirm/route.ts ✅ (POST)
      convert-to-booking/route.ts ✅ (POST)
      reschedule/route.ts ✅ (POST)
      status/route.ts ✅ (PATCH)
      tasks/route.ts ✅ (GET, POST)
  services/
    route.ts ✅ (GET, POST, PATCH)
    export/route.ts ✅ (GET)
    stats/route.ts ✅ (GET)
    bulk/route.ts ✅ (POST)
    [id]/
      route.ts ✅ (GET, PUT, DELETE)
      clone/route.ts ✅ (POST)
      settings/route.ts ✅ (PATCH)
      versions/route.ts ✅ (GET)
    slug-check/[slug]/route.ts ✅ (GET)
  stats/
    bookings/route.ts ✅ (GET)
    clients/route.ts ✅ (GET)
    counts/route.ts ✅ (GET, POST:405)
    posts/route.ts ✅ (GET)
    users/route.ts ✅ (GET)
  system/health/route.ts ✅ (GET)
  tasks/
    route.ts ✅ (GET, POST)
    [id]/route.ts ✅ (GET, PUT, DELETE)
    [id]/assign/route.ts ✅ (POST)
    [id]/comments/route.ts ✅ (GET, POST)
    [id]/status/route.ts ✅ (PATCH)
    analytics/route.ts ✅ (GET)
    bulk/route.ts ✅ (POST)
    export/route.ts ✅ (GET)
    notifications/route.ts ✅ (GET, PATCH)
    stream/route.ts ✅ (GET)
    templates/
      route.ts ✅ (GET, POST)
      categories/route.ts ✅ (GET)
  team-management/
    assignments/route.ts ✅ (GET)
    availability/route.ts ✅ (GET)
    skills/route.ts ✅ (GET, PATCH)
    workload/route.ts ✅ (GET)
  team-members/
    route.ts ✅ (GET, POST)
    [id]/route.ts ✅ (GET, PUT, DELETE)
  thresholds/route.ts ✅ (GET, POST)
  updates/route.ts ✅ (GET)
  uploads/quarantine/route.ts ✅ (GET, POST)
  users/
    route.ts ✅ (GET)
    [id]/route.ts ✅ (PATCH)
  work-orders/
    route.ts ✅ (GET, POST)
    [id]/route.ts ✅ (GET, PUT, DELETE)
```

### src/lib
```
src/lib/
  auth.ts ✅ (NextAuth config; demo users when no DB) 
  auth-middleware.ts ✅
  prisma.ts ✅ (lazy Prisma client factory)
  permissions.ts ✅ (PERMISSIONS/ROLE_PERMISSIONS/guards)
  audit.ts ✅ (audit logging)
  api.ts ✅ (apiFetch, client helpers)
  api-cache.ts ✅
  api-response.ts ✅
  analytics.ts ✅
  admin-export.ts ✅ (buildExportUrl/downloadExport)
  csv-export.ts ✅
  cron.ts ✅
  email.ts ✅
  exchange.ts ✅
  idempotency.ts ✅
  logger.ts ✅
  notification.service.ts ✅
  observability.ts ✅
  observability-helpers.ts ✅
  performance.ts ✅
  rate-limit.ts ✅
  rbac.ts ✅
  realtime*.ts ✅ (real-time helpers)
  tenant.ts ✅ (tenant header/filter)
  toast-api.ts ✅
  uploads-provider.ts ✅
  use-permissions.ts ✅
  utils.ts ✅
  validation.ts ✅
  booking/* ✅
  cache/redis.ts ✅
  events/service-events.ts ✅
  offline/* ✅
  payments/stripe.ts ✅
  service-requests/assignment.ts ✅
  services/utils.ts ✅
  tasks/* ✅
```

### src/components/admin
```
src/components/admin/
  layout/* ✅ (shell, providers, sidebar, header, tenant switcher)
  analytics/* ✅ (cards, charts, health)
  dashboard/* ✅ (overview, performance dashboard)
  permissions/* ✅ (role/user inspectors)
  service-requests/* ✅ (table, filters, charts)
  services/* ✅ (form, analytics, filters, headers)
  settings/SettingsNavigation.tsx ✅
  AvailabilitySlotsManager.tsx ✅
  BookingSettingsPanel.tsx ✅
  RunRemindersButton.tsx ✅
  currency-manager.tsx ✅
  team-management.tsx ✅
  chat/AdminChatConsole.tsx ✅
```

Notes:
- ⚠️ Legacy/preview files: layout-nuclear.tsx, page-nuclear.tsx, page-simple.tsx, previews/*, tasks/*/TODO+log.md.
- ⚠️ Mock data present in bookings/new/page.tsx (temporary fallback). Remove on production.
- ✅ Most lib and UI modules are reusable across admin pages.

---

## Feature & Component Architecture
Module breakdown with key components/pages and roles:
- Services
  - Pages: /admin/services, /admin/services/list, /admin/services/[id]
  - Components: ServicesHeader, ServicesFilters, ServiceForm, ServiceCard, ConversionsTable, RevenueTimeSeriesChart
  - API: /api/admin/services (GET, POST, PATCH), /export, /stats, /[id] (GET/PUT/DELETE), /[id]/clone, /[id]/settings, /[id]/versions, slug-check
- Bookings
  - Pages: /admin/bookings, /admin/bookings/new ⚠️ (mock), /admin/bookings/[id]
  - API: /api/admin/bookings (GET/POST/PATCH/DELETE), /pending-count, /stats, /[id]/migrate
- Tasks
  - Pages: /admin/tasks, /admin/tasks/list, /admin/tasks/new
  - Components: rich task UI (cards, views board/calendar/gantt/table), forms, filters, analytics
  - Hooks: useTaskActions, useTaskAnalytics, useTaskBulkActions, useTaskFilters, useTaskPermissions, TaskProvider
  - API: /api/admin/tasks (GET/POST), /[id] (GET/PUT/DELETE), /[id]/assign, /[id]/status, /[id]/comments, /analytics, /bulk, /export, /templates, /templates/categories, /notifications, /stream
- Service Requests
  - Pages: index/list/new/[id]/edit
  - Components: table, filters, overview, calendar-view, analytics widgets
  - Hooks: useServiceRequests (global), useRealtime
  - API: comprehensive CRUD + actions (assign, status, reschedule, comments), analytics, export, availability, bulk, migrate to booking
- Clients/Users
  - Pages: clients (list/new/invitations/profiles), users (list)
  - API: /api/admin/users (GET), /users/[id] (PATCH)
- Team Management
  - Pages: /admin/team (shell), team-management component
  - API: /api/admin/team-members (GET/POST), /team-members/[id] (GET/PUT/DELETE), /team-management/* (skills/availability/assignments/workload)
- Invoices/Payments/Expenses
  - Pages: invoices, payments, expenses, invoices/sequences
  - Components: list templates; export helpers
  - API: /api/admin/invoices (+/[id]/pay), /payments (via exports and analytics pages), /expenses (GET/POST/PATCH)
- Analytics/Reports/Activity
  - Pages: analytics, reports, audits
  - Components: AnalyticsDashboard, KPI grids, charts, SystemHealthPanel
  - API: /api/admin/analytics, /stats/*, /activity, /export (csv)
- Settings
  - Pages: settings hub + booking/company/contact/timezone/financial/currencies
  - Components: BookingSettingsPanel, SettingsNavigation
  - API: /api/admin/booking-settings/* with Zod validation
- Integrations/Uploads/Security
  - Pages: integrations, uploads/quarantine, security
  - API: uploads quarantine (GET/POST), system/health

Unused/duplicates observed:
- ⚠️ Previews/*, layout-nuclear/page-nuclear/page-simple, tasks/*/TODO+log.md; consider removal or hide in production builds.

---

## Data Flow Architecture
- UI layer: Admin pages consume components and hooks, fetch with apiFetch (src/lib/api.ts) or SWR.
- Hooks/state:
  - SWR for data fetching, local component state for filters/pagination.
  - Context providers: AdminProviders, TaskProvider; permission gating via use-permissions.ts; real-time via realtime-enhanced and useRealtime.
  - Optimistic updates used in specific modules (tasks/service-requests) where applicable.
- API layer: Next.js Route Handlers under src/app/api/admin/** expose REST-like endpoints exporting GET/POST/PUT/PATCH/DELETE.
- Validation: Zod in booking settings and selected endpoints; parseListQuery for pagination/filters.
- ORM: Prisma via src/lib/prisma.ts (lazy client; uses NETLIFY_DATABASE_URL if present or default DATABASE_URL from env via adapter’s default behavior).
- Auth: NextAuth (Credentials) with PrismaAdapter when DB available; session strategy jwt; role attached to token; middleware gates /admin.
- Realtime: realtime-enhanced, server-sent events (tasks/stream), Redis optional (cache/redis.ts).

---

## Custom Hooks
- src/lib/use-permissions.ts
  - Input: session role (via next-auth); Output: has(permission), all(), role; Deps: PERMISSIONS, ROLE_PERMISSIONS.
- src/hooks/useServiceRequests.ts
  - Input: { scope, page, limit, filters } ; Output: { items, pagination, isLoading, refresh } ; Deps: apiFetch, SSE via useRealtime optional.
- src/hooks/useRealtime.ts
  - Input: event keys array; Output: { events } stream; Deps: EventSource /api/*/stream endpoints.
- src/hooks/useUnifiedData.ts
  - Input: key, filters; Output: { data, isLoading, mutate }; Deps: fetch aggregation.
- src/hooks/useBookings.ts / useBooking.ts
  - Booking list/detail accessors using SWR/fetch; standard list params.
- src/hooks/useServicesData.ts / useServicesPermissions.ts
  - Services data loader and permission helpers.
- src/app/admin/tasks/hooks/*
  - useTaskActions: create/update/delete/assign; depends on /api/admin/tasks/*
  - useTaskAnalytics: charts/KPIs via /api/admin/tasks/analytics
  - useTaskBulkActions: bulk status/delete
  - useTaskFilters: local filter state + URL sync
  - useTaskPermissions: derives flags from role/permissions
- src/hooks/admin/* (performance)
  - usePerformanceMonitoring/Analytics: UX metrics capture and charting.

---

## API Architecture
- Methods: see per-route listing in “src/app/api/admin” tree above.
- Common patterns:
  - AuthN/AuthZ: getServerSession(authOptions) + hasPermission checks; respond 401 on missing; middleware adds coarse route RBAC.
  - Pagination: parseListQuery or explicit limit/offset/skip/take usage; counts via X-Total-Count + pagination payloads.
  - Tenant scoping: getTenantFromRequest + tenantFilter on queries.
  - Audit logging: logAudit on create/update/delete/export actions.
  - Exports: /api/admin/export?entity=... returns CSV with Content-Disposition.
- Example payloads/snippets:
```ts
// List service requests (GET /api/admin/service-requests?page=1&limit=10&status=ALL)
return NextResponse.json({
  success: true,
  data: items,
  pagination: { page, limit, total, totalPages }
})

// Update user role (PATCH /api/admin/users/[id])
{ role?: 'CLIENT'|'TEAM_MEMBER'|'TEAM_LEAD'|'ADMIN', name?: string }
```

---

## Routes and Imports
- Mapping (examples):
  - /admin/services → components/admin/services/* → /api/admin/services/*
  - /admin/bookings → list UI → /api/admin/bookings/*
  - /admin/tasks → rich UI → /api/admin/tasks/* + /stream
  - /admin/service-requests → list/calendar/analytics → /api/admin/service-requests/*
  - /admin/invoices → list/actions → /api/admin/invoices/*
  - /admin/expenses → list/actions → /api/admin/expenses
  - /admin/reports → AnalyticsPage + exports → /api/admin/export
  - /admin/settings/booking → BookingSettingsPanel → /api/admin/booking-settings/*
- Imports sanity:
  - No broken imports detected in scan; one fixed earlier (duplicate import in export route).
  - ⚠️ TODO in AdminHeader (global search not implemented); preview and legacy files present.
- Data sources:
  - Real DB via Prisma; some pages (bookings/new) contain mock fallback data ⚠️.

---

## Integration Points
- Environment Variables (observed):
  - NEXTAUTH_SECRET, NEXTAUTH_URL
  - NETLIFY_DATABASE_URL (used to gate DB adapter); standard Prisma DATABASE_URL is implied via @prisma/client
  - STRIPE_* (payments) via src/lib/payments/stripe.ts
  - SENTRY_DSN via @sentry/nextjs
  - UPSTASH_REDIS_REST_URL/KEY (optional, cache/redis.ts)
  - MULTI_TENANCY_ENABLED (middleware tenant header propagation)
- External/MCP-like integrations:
  - Prisma/Postgres, NextAuth, Redis, Sentry, Stripe; real-time via custom SSE.
- Module dependencies:
  - Bookings ↔ Invoices ↔ Payments (export/reporting)
  - Service Requests ↔ Tasks ↔ Reminders/Email
  - Roles ↔ Permissions (gates UI + API)

---

## Security & Permissions
- Frontdoor: src/app/middleware.ts redirects unauthenticated from /admin to /login; only staff roles (ADMIN/TEAM_LEAD/TEAM_MEMBER) allowed.
- Fine-grained: PERMISSIONS and ROLE_PERMISSIONS checked in nearly all admin API routes. Common patterns:
  - ANALYTICS_VIEW/EXPORT for reports/exports/activity
  - TEAM_VIEW/MANAGE for team endpoints
  - SERVICES_* for services CRUD/analytics/export
  - SERVICE_REQUESTS_* and TASKS_* for SR/Tasks
  - BOOKING_SETTINGS_* for booking settings
- Risks/notes:
  - Ensure every new admin route calls getServerSession and hasPermission; a few routes using Request (not NextRequest) still perform checks correctly.
  - Confirm Content-Disposition on exports does not leak sensitive tenant info.

---

## Performance & Testing
- Performance risks:
  - Potential N+1 in pages with deep include chains; use select/include narrowly and pagination everywhere (most routes use parseListQuery, skip/take, or capped pageSize).
  - Streaming endpoints (tasks/stream) should guard against unbounded event growth.
- Pagination/filters:
  - Present in bookings, service-requests, tasks, uploads/quarantine, invoices, services; limits capped to 100–500.
- Testing:
  - Unit/integration tests present for tasks API, providers, and utilities under src/app/admin/tasks/tests and tests/*. Extensive tests directory exists plus e2e/ with Playwright.
  - Recommend adding integration tests for invoices/payments/expenses CRUD & exports.

---

## Cleanup Notes
- Remove or isolate for dev-only:
  - ⚠️ src/app/admin/layout-nuclear.tsx, page-nuclear.tsx, page-simple.tsx
  - ⚠️ src/app/admin/previews/*
  - ⚠️ src/app/admin/tasks/*/TODO+log.md
  - ⚠️ Mock data in src/app/admin/bookings/new/page.tsx (replace with real API)
- Address TODOs:
  - Global search in AdminHeader
- Consistency:
  - Ensure all list pages use shared ListPage/AdvancedDataTable patterns
  - Standardize export filename patterns across entities
- Security:
  - Re-scan any newly added admin routes for missing hasPermission checks
- Observability:
  - Confirm logAudit coverage on critical actions across all modules

---

## Appendix: Key Guards and Utilities (signatures)
```ts
// RBAC
export function hasPermission(userRole: string | undefined | null, permission: Permission): boolean

// Tenant
export function getTenantFromRequest(req: Request|NextRequest): string|undefined
export function tenantFilter(tenantId?: string): Record<string, any>

// Admin export helper (client)
export function downloadExport(params: Record<string,string|number|boolean|undefined>): void
```

# Admin Sidebar Audit & Settings Panel Enhancement

Paths
- Sidebar: src/components/admin/layout/AdminSidebar.tsx
- Layouts: src/components/admin/layout/{ClientOnlyAdminLayout.tsx, AdminDashboardLayout.tsx}
- Header/Tenant: src/components/admin/layout/{AdminHeader.tsx, TenantSwitcher.tsx}
- Legacy nav config (duplicated concept): src/components/dashboard/nav.config.ts ⚠️

Summary
- Role: Primary navigation for all admin capabilities, with sections (dashboard, business, financial, operations, system), nested items, badges, RBAC checks. Responsive with mobile overlay, collapsible children. Uses counts from /api/admin/stats/counts.

Findings
- Structure & Links
  - Sections: dashboard, business, financial, operations, system; children per item.
  - Dead/missing routes ⚠️: /admin/services/categories, /admin/services/analytics, /admin/invoices/templates, /admin/uploads (root). Backed pages do not exist in src/app/admin.
  - Missing but available pages: /admin/newsletter, /admin/notifications, settings/{company,contact,timezone,financial}. Add to sidebar.
  - Previews/* are not linked (good) and should remain hidden in production.
- RBAC
  - Mixed coverage: some items specify permission (e.g., SERVICES_VIEW), others do not.
  - Recommend permissions:
    - Financial (Invoices, Payments, Expenses, Taxes, Reports): PERMISSIONS.ANALYTICS_VIEW
    - Tasks: TASKS_READ_ALL or TASKS_READ_ASSIGNED (derive visibility by role)
    - Reminders: ANALYTICS_VIEW or a dedicated REMINDERS_VIEW if added
    - Chat: restrict to staff (TEAM_VIEW) if needed
- State & Behavior
  - Collapsible handling uses last path segment as key; initial expandedSections includes ['dashboard','business'] but only item-level collapses exist (not section-level). Consider explicit ids per group/item.
  - Expanded state not persisted; add localStorage to remember collapses and favorites.
  - Active detection uses startsWith, OK for hierarchical match.
- Counts/Badges
  - Counts are wired to /api/admin/stats/counts with sample values. Extend to include invoices overdue, quarantine items, unread chat, etc. Ensure SSE revalidation covers needed events.
- Accessibility
  - Good: aria-current, aria-expanded/controls, role="group" labels.
  - Gaps: When collapsed, text is hidden; add aria-label on <Link>/<button> or render a visually-hidden label to ensure screen readers announce item names.
  - Keyboard: Provide roving tabindex and ArrowLeft/Right to expand/collapse submenus. Ensure focus visible styles.
  - Mobile overlay focus trap and ESC to close (currently click-out only from AdminSidebar).
- Responsiveness
  - ClientOnlyAdminLayout mounts mobile sidebar only when open (OK) and relies on AdminSidebar’s own backdrop.
  - AdminDashboardLayout (not in use) also renders a separate backdrop while AdminSidebar renders one too → potential double overlay if adopted later ⚠️. Unify backdrop ownership when switching layouts.
- Duplication Risk ⚠️
  - nav.config.ts defines a separate nav grouping with overlapping labels and permissions. Divergence likely over time. Centralize to a single admin nav registry.

Recommendations (Implementation Plan)
1) Centralize Nav Registry
- Create src/components/admin/layout/admin-nav.ts exporting a typed registry consumed by AdminSidebar and (optionally) AdminHeader breadcrumbs.
- Remove or deprecate src/components/dashboard/nav.config.ts for admin. Keep a separate site-level nav if needed.

Proposed types
```ts
// src/components/admin/layout/admin-nav.ts
import type { Permission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { type ComponentType } from 'react'

export type NavId =
  | 'overview' | 'analytics' | 'reports'
  | 'bookings' | 'calendar' | 'availability' | 'booking-new'
  | 'clients' | 'client-profiles' | 'client-invitations' | 'client-new'
  | 'services' | 'service-requests'
  | 'invoices' | 'invoice-sequences'
  | 'payments' | 'expenses' | 'taxes'
  | 'tasks' | 'team' | 'chat' | 'reminders'
  | 'settings' | 'settings-company' | 'settings-contact' | 'settings-timezone' | 'settings-financial' | 'settings-currencies' | 'settings-booking'
  | 'users' | 'roles' | 'permissions'
  | 'security' | 'audits' | 'compliance' | 'uploads-quarantine'
  | 'cron-telemetry' | 'integrations' | 'newsletter' | 'notifications'

export interface AdminNavItem {
  id: NavId
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  permission?: Permission
  featureFlag?: string
  children?: AdminNavItem[]
  getBadge?: (ctx: { tenantId?: string; role?: string }) => Promise<string | number | undefined>
}

export interface AdminNavSection { label: string; id: string; items: AdminNavItem[] }
export const adminNav: AdminNavSection[] = [ /* fill with items from audit, ensuring only real routes */ ]
```

2) Clean Up Links and Add Missing Ones
- Remove dead routes: services/categories, services/analytics, invoices/templates, uploads root.
- Add: newsletter, notifications, settings subpages (company, contact, timezone, financial).
- Consider a Content section (Posts, Newsletter) if content management is part of admin.

3) RBAC Hardening
- Annotate all items with permission. Suggested mapping:
  - Dashboard: Overview (none), Analytics/Reports (ANALYTICS_VIEW)
  - Business: Bookings (TEAM_VIEW), Calendar (TEAM_VIEW), Availability (TEAM_VIEW), New Booking (TEAM_VIEW), Clients (USERS_VIEW), Services (SERVICES_VIEW), Service Requests (SERVICE_REQUESTS_READ_ALL)
  - Financial: Invoices/Payments/Expenses/Taxes/Reports (ANALYTICS_VIEW)
  - Operations: Tasks (TASKS_READ_ALL or show when TASKS_READ_ASSIGNED), Team (TEAM_VIEW), Chat (TEAM_VIEW), Reminders (ANALYTICS_VIEW)
  - System: Settings (BOOKING_SETTINGS_VIEW), Booking Settings (BOOKING_SETTINGS_VIEW), Currencies (ANALYTICS_VIEW), Users (USERS_VIEW), Roles (USERS_MANAGE), Permissions (USERS_MANAGE), Security/Audits/Compliance (ANALYTICS_VIEW), Uploads (ANALYTICS_VIEW), Cron Telemetry (ANALYTICS_VIEW), Integrations (ANALYTICS_VIEW)

4) UX Enhancements for a Comprehensive Settings Panel
- Create a first-class Settings mega-section with categories and pages:
  - Organization: General, Company, Contact, Timezone, Financial, Currencies
  - Booking: Steps, Business Hours, Payment Methods, Import/Export/Reset
  - Integrations: Payments (Stripe), Email, Analytics (Sentry), Realtime/Cache
  - Security: Users, Roles, Permissions, Audit, Compliance, Session policy
  - System: Env diagnostics, Health, Cron telemetry
- Add status badges: e.g., “Action required” when env/config missing, or “Degraded” when health checks fail.
- Provide quick actions: “Export settings”, “Reset to defaults” (existing APIs), “Test email”, “Test Stripe”.

5) Personalization & Productivity
- Favorites/Pinning: let users pin items to a “Quick Access” group (persisted in localStorage per user).
- Search within sidebar: filter items by label/alias; keyboard focus jump.
- Recently visited: show last N routes for quick return.

6) Accessibility and Mobile
- Collapsed mode: add aria-labels or visually-hidden labels on items; optional tooltip on hover/focus.
- Keyboard: implement arrow key navigation and Enter/Space toggle for submenus.
- Mobile: move backdrop ownership to layout, trap focus in the sidebar, close on ESC.

7) Performance
- Memoize built nav via useMemo and derive badges asynchronously via getBadge; throttle badge refresh to avoid chattiness.
- Tree-shake icons by importing only those used.

8) Delivery Checklist
- Implement admin-nav.ts and refactor AdminSidebar to consume it.
- Remove dead links; add missing settings items and content section.
- Apply permission mapping and add hasPermission checks consistently.
- Persist expanded/collapsed state and favorites to localStorage.
- Add a11y improvements (labels, keyboard, focus trap).
- QA mobile open/close (ensure single backdrop) across ClientOnlyAdminLayout and (future) AdminDashboardLayout.
- Update docs and screenshots.

Known Gaps To Address
- Global search in AdminHeader is not implemented.
- Some counts are sample values; replace with DB-backed counts in production.
- Duplicate nav sources (AdminSidebar vs nav.config.ts). Unify to eliminate drift.

---

# Booking Settings Panel Audit

Files
- UI: src/components/admin/BookingSettingsPanel.tsx; Page wrapper: src/app/admin/settings/booking/page.tsx
- Service: src/services/booking-settings.service.ts
- API routes: src/app/api/admin/booking-settings/{route.ts, steps/route.ts, business-hours/route.ts, payment-methods/route.ts, export/route.ts, import/route.ts, reset/route.ts, validate/route.ts}
- Schemas: src/schemas/booking-settings.schemas.ts
- Types: src/types/booking-settings.types.ts

UI Overview
- Tabs: General, Payments, Booking Steps, Availability, Notifications, Customer Experience, Team Assignments, Dynamic Pricing.
- Local state: settings (loaded via GET), pending (per-section patch buffer), errors, saving, saved flag.
- Actions:
  - Save (PUT /api/admin/booking-settings) with pending object shaped as {generalSettings, paymentSettings, stepSettings, availabilitySettings, notificationSettings, customerSettings, assignmentSettings, pricingSettings}.
  - Reset (POST /api/admin/booking-settings/reset) → recreates defaults.
  - Export (GET /api/admin/booking-settings/export) → downloads JSON.
- Gaps:
  - No Import UI despite import endpoint available.
  - Warnings from validation are returned by PUT but not surfaced in the panel UI.
  - No client-side schema validation; only server-side errors displayed.

Validation & Rules
- Main PUT validates via service.validateSettingsUpdate:
  - Payment: if paymentRequired → at least one method enabled; if allowPartialPayment → depositPercentage in [10,100].
  - Availability: minAdvanceBookingHours ≥ 0; advanceBookingDays > 730 → warning.
  - Steps: service/dateTime/customerDetails cannot be disabled; enabling payment step without paymentRequired → warning.
  - Notifications: reminderHours between 0 and 8760.
  - Pricing: surcharges in [0,2] (0–200%).
- Section endpoints enforce Zod schemas:
  - steps: BookingSettingsStepsPayload { steps: BookingStepsArraySchema }
  - business-hours: BookingSettingsBusinessHoursPayload { businessHours: BusinessHoursArraySchema }
  - payment-methods: BookingSettingsPaymentMethodsPayload { paymentMethods: PaymentMethodsArraySchema }

Service Layer
- getBookingSettings: tenant-scoped fetch with cache (CacheService, 5 min TTL), includes related steps/businessHours/paymentMethods/notificationTemplates; backfills lists if missing.
- createDefaultSettings: creates baseline BookingSettings + defaults (steps, business hours, payment methods, notification templates) in a transaction.
- updateBookingSettings: merges section patches, handles JSON nulls via Prisma.DbNull, updates updatedAt; invalidates cache.
- updateBookingSteps/businessHours/paymentMethods: replace/upsert patterns executed transactionally; invalidates cache.
- exportSettings/importSettings/resetToDefaults: full bundle operations with audit logs.

API & Permissions
- GET /api/admin/booking-settings → BOOKING_SETTINGS_VIEW
- PUT /api/admin/booking-settings → BOOKING_SETTINGS_EDIT
- POST /api/admin/booking-settings/validate → BOOKING_SETTINGS_VIEW
- PUT /api/admin/booking-settings/steps → BOOKING_SETTINGS_EDIT (Zod-validated)
- PUT /business-hours → BOOKING_SETTINGS_EDIT (Zod-validated)
- PUT /payment-methods → BOOKING_SETTINGS_EDIT (Zod-validated)
- GET /export → BOOKING_SETTINGS_EXPORT
- POST /import → BOOKING_SETTINGS_IMPORT
- POST /reset → BOOKING_SETTINGS_RESET
- All routes: getServerSession + tenant extraction via getTenantFromRequest; audit logging on update/export/import/reset.

Data Model
- BookingSettings entity with many scalar flags plus JSON fields (businessHours, blackoutDates, holidaySchedule, reminderHours) and relations:
  - steps: BookingStepConfig[]
  - businessHoursConfig: BusinessHoursConfig[]
  - paymentMethods: PaymentMethodConfig[]
  - notificationTemplates: NotificationTemplate[]
- UpdateRequest types mirror section patches for safe partial updates.

Multi-Tenancy & Caching
- Tenant inferred via header/cookie/subdomain (middleware). Service caches per-tenant key booking-settings:{tenant|default}.
- Cache invalidated on any write; rehydrated on read.

Accessibility & UX Notes
- Sidebar within panel uses semantic buttons; consider adding aria-current on active tab.
- Save disabled when no pending changes; show success toast/state; surface warnings (non-blocking) inline.
- Add Import dialog with file input (JSON), preview of selected sections, overwrite toggle (matches API contract).

Security Considerations
- Strong RBAC separation per endpoint; ensure UI hides actions the user cannot perform (e.g., hide Import/Reset if lacking perms).
- Validate numbers to avoid extreme values that could impact performance (already guarded).

Performance Considerations
- Prefer granular section endpoints (steps/business-hours/payment-methods) for large payloads to reduce contention and payload size.
- Keep reminderHours arrays bounded; avoid very large blackoutDates/holidaySchedule without pagination.

Issues/Risks
- Missing Import UI; admins cannot restore exported bundles from panel.
- Warnings from validate/PUT not displayed; could cause confusion.
- Client does not type BookingSettings strongly (any); increases runtime risk.

Recommendations
- Add Import button to BookingSettingsPanel:
  - Opens modal to upload JSON, chooses sections, overwriteExisting, calls POST /import, then reloads.
- Surface warnings: show non-blocking alert when PUT returns { warnings }.
- Client-side validation: replicate key Zod rules or call /validate before PUT to show inline guidance.
- Strong typing: type settings/pending with BookingSettings and BookingSettingsUpdateRequest.
- Autosave (optional): detect changes and debounce PUT per section for better UX.
- Add gateway configs UI (Stripe keys, etc.) with secure storage patterns.
- Unit tests: add tests for validate endpoint and service update edge cases; integration test for import/export/reset flow.

Test Coverage Suggestions
- API: booking-settings main PUT (valid/invalid), steps/business-hours/payment-methods PUT (schema errors), export/import/reset, validate POST.
- Service: validateSettingsUpdate edge cases; importSettings with each section; resetToDefaults idempotence.
- UI: render all tabs, pending change dot indicator, save/reset/export flows, error/warning display.
