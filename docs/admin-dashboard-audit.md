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
  chat/AdminChatConsole.tsx ���
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
