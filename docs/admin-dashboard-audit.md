# Admin Dashboard Audit

## Overview
- Purpose: Centralized back-office for staff to manage services, bookings, service requests, tasks, users/teams, analytics, settings, and operations.
- High-level features: CRUD for core entities, reporting/analytics, role/permission enforcement, multi-tenancy guards, exports/imports, attachments quarantine, availability management, reminders/cron hooks, optimistic UI with SWR, realtime notifications.

## Complete Current Directory Structure

Legend: ✅ reusable/shared • ⚠️ duplicate/placeholder/suspicious

### src/app/admin
```
src/app/admin/
├─ layout.tsx
├─ layout-nuclear.tsx ⚠️ (alt layout, appears unused in navigation)
├─ page.tsx
├─ page-simple.tsx ⚠️ (alternate)
├─ page-nuclear.tsx ⚠️ (alternate)
├─ analytics/page.tsx
├─ audits/page.tsx
├─ availability/page.tsx
├─ bookings/
│  ├─ page.tsx
│  ├─ [id]/page.tsx
│  └─ new/page.tsx
├─ calendar/page.tsx
├─ chat/page.tsx
├─ clients/
│  ├─ page.tsx
│  ├─ invitations/page.tsx
│  ├─ new/page.tsx
│  └─ profiles/page.tsx
├─ compliance/page.tsx
├─ cron-telemetry/page.tsx
├─ expenses/page.tsx
├─ integrations/page.tsx
├─ invoices/
│  ├─ page.tsx
│  └─ sequences/page.tsx
├─ newsletter/page.tsx
├─ notifications/page.tsx
├─ payments/page.tsx
├─ permissions/page.tsx
├─ perf-metrics/page.tsx
├─ posts/page.tsx
├─ previews/
│  ├─ analytics/page.tsx
│  ├─ list/page.tsx
│  └─ standard/page.tsx
├─ reminders/page.tsx
├─ reports/page.tsx
├─ roles/page.tsx
├─ security/page.tsx
├─ service-requests/
│  ├─ page.tsx
│  ├─ ClientPage.tsx ✅
│  ├─ list/page.tsx
│  ├─ new/page.tsx
│  ├─ [id]/page.tsx
│  └─ [id]/edit/page.tsx
├─ services/
│  ├─ page.tsx
│  └─ list/page.tsx
├─ settings/
│  ├─ page.tsx
│  ├─ booking/page.tsx
│  └─ currencies/page.tsx
├─ tasks/
│  ├─ page.tsx
│  ├─ list/page.tsx
│  ├─ new/page.tsx
│  ├─ TODO+log.md ⚠️ (dev note)
│  ├─ new/TODO+log.md ⚠️ (dev note)
│  ├─ data/
│  │  ├─ notifications.json
│  │  ├─ templates.json
│  │  └─ comments/1.json ⚠️ (fixture)
│  ├─ hooks/ (custom task hooks) ✅
│  ├─ providers/TaskProvider.tsx ✅
│  ├─ schemas/task.ts ✅
│  ├─ components/ ✅
│  │  ├─ analytics/...
│  │  ├─ bulk/...
│  │  ├─ cards/...
│  │  ├─ comments/...
│  │  ├─ export/...
│  │  ├─ filters/...
│  │  ├─ forms/...
│  │  ├─ layout/...
│  │  ├─ modals/...
│  │  ├─ providers/...
│  │  ├─ views/...
│  │  └─ widgets/...
│  └─ tests/ ✅ (unit/integration for tasks)
├─ taxes/page.tsx
├─ team/page.tsx
├─ uploads/quarantine/
│  ├─ page.tsx
│  └─ QuarantineClient.tsx ✅
└─ users/
   ├─ page.tsx
   └─ list/page.tsx
```

### src/app/api/admin
```
src/app/api/admin/
├─ activity/route.ts (GET)
├─ analytics/route.ts (GET, 405 POST)
├─ availability-slots/route.ts (GET, POST, PUT, DELETE)
├─ auth/logout/route.ts (POST)
├─ booking-settings/
│  ├─ route.ts (GET?) ⚠️ (not inspected)
│  ├─ business-hours/route.ts (GET/PUT?) ⚠️
│  ├─ export/route.ts (GET)
│  ├─ import/route.ts (POST)
│  ├─ payment-methods/route.ts (GET/PUT?) ⚠️
│  ├─ reset/route.ts (POST)
│  ├─ steps/route.ts (GET/PUT?) ⚠️
│  └─ validate/route.ts (POST)
├─ bookings/
│  ├─ route.ts (GET, POST, PATCH, DELETE)
│  ├─ [id]/migrate/route.ts (POST?) ⚠️
│  ├─ pending-count/route.ts (GET)
│  └─ stats/route.ts (GET)
├─ chat/route.ts (GET/POST?) ⚠️
├─ currencies/
│  ├─ route.ts (GET, POST)
│  ├─ [code]/route.ts (GET)
│  ├─ export/route.ts (GET)
│  ├─ overrides/route.ts (GET/PUT?) ⚠️
│  └─ refresh/route.ts (POST)
├─ export/route.ts (GET)
├─ health-history/route.ts (GET)
├─ perf-metrics/route.ts (GET)
├─ permissions/
│  ├─ route.ts (GET)
│  ├─ roles/route.ts (GET)
│  └─ [userId]/route.ts (GET)
├─ realtime/route.ts (GET) ⚠️ (likely SSE/WS)
├─ reminders/run/route.ts (POST)
├─ service-requests/
│  ├─ route.ts (GET, POST)
│  ├─ analytics/route.ts (GET)
│  ├─ availability/route.ts (GET)
│  ├─ bulk/route.ts (POST)
│  ├─ export/route.ts (GET)
│  ├─ pending-count/route.ts (GET)
│  ├─ recurring/preview/route.ts (POST)
│  ├─ [id]/route.ts (GET, PATCH, DELETE)
│  ├─ [id]/assign/route.ts (POST)
│  ├─ [id]/comments/route.ts (GET, POST)
│  ├─ [id]/confirm/route.ts (POST)
│  ├─ [id]/convert-to-booking/route.ts (POST)
│  ├─ [id]/reschedule/route.ts (POST)
│  ├─ [id]/status/route.ts (POST)
│  └─ [id]/tasks/route.ts (POST)
├─ services/
│  ├─ route.ts (GET, HEAD, POST)
│  ├─ export/route.ts (GET)
│  ├─ stats/route.ts (GET)
│  ├─ bulk/route.ts (POST)
│  ├─ slug-check/[slug]/route.ts (GET)
│  ├─ [id]/route.ts (GET, PATCH, DELETE)
│  ├─ [id]/clone/route.ts (POST)
│  ├─ [id]/settings/route.ts (GET/PUT?) ⚠️
│  └─ [id]/versions/route.ts (GET) ⚠️
├─ stats/
│  ├─ bookings/route.ts (GET)
│  ├─ clients/route.ts (GET)
│  ├─ posts/route.ts (GET)
│  └─ users/route.ts (GET)
├─ system/health/route.ts (GET)
├─ tasks/
│  ├─ route.ts (GET, POST)
│  ├─ analytics/route.ts (GET)
│  ├─ bulk/route.ts (POST)
│  ├─ export/route.ts (GET)
│  ├─ notifications/route.ts (GET/POST?) ⚠️
│  ├─ stream/route.ts (GET) ⚠️ (SSE)
│  ├─ templates/route.ts (GET)
│  ├─ templates/categories/route.ts (GET)
│  ├─ [id]/route.ts (GET, PATCH, DELETE)
│  ├─ [id]/assign/route.ts (POST)
│  ├─ [id]/comments/route.ts (GET, POST)
│  └─ [id]/status/route.ts (POST)
├─ team-management/
│  ├─ assignments/route.ts (GET)
│  ├─ availability/route.ts (GET)
│  ├─ skills/route.ts (GET)
│  └─ workload/route.ts (GET)
├─ team-members/
│  ├─ route.ts (GET, POST)
│  └─ [id]/route.ts (GET, PUT, DELETE)
├─ thresholds/route.ts (GET)
├─ updates/route.ts (GET)
├─ uploads/quarantine/route.ts (GET, POST)
└─ users/
   ├─ route.ts (GET)
   └─ [id]/route.ts (PATCH)
```

### src/lib ✅
```
src/lib/
├─ analytics.ts ✅
├─ api.ts ✅
├─ api-error.ts ✅
├─ api-response.ts ✅
├─ audit.ts ✅
├─ auth.ts ✅ (NextAuth config)
├─ auth-middleware.ts ✅
├─ cache.service.ts ✅ (Redis wrapper)
├─ chat.ts ✅
├─ clamav.ts ✅
├─ cron.ts ✅
├─ csv-export.ts ✅
├─ decimal-utils.ts ✅
├─ dev-fallbacks.(ts|d.ts) ⚠️ (dev data fallbacks)
├─ email.ts ✅ (SendGrid)
├─ exchange.ts ✅
├─ i18n.ts ✅
├─ idempotency.ts ✅
├─ logger.ts ✅
├─ notification.service.ts ✅
├─ observability*.ts ✅
├─ offline-queue.ts ✅
├─ performance.ts ✅
├─ permissions.ts ✅ (RBAC used in admin APIs)
├─ prisma.ts ✅ (lazy Prisma client)
├─ rate-limit.ts ✅
├─ rbac.ts ⚠️ (duplicate RBAC concept; separate from permissions.ts)
├─ realtime*.ts ✅
├─ tenant.ts ✅
├─ toast-api.ts ✅
├─ uploads-provider.ts ✅
├─ use-permissions.ts ✅ (client hook)
├─ utils.ts ✅
├─ validation.ts ✅ (zod)
├─ api/error-responses.ts ✅
├─ booking/* ✅
├─ cache/redis.ts ✅
├─ events/service-events.ts ✅
├─ offline/* ✅
├─ payments/stripe.ts ✅
├─ service-requests/assignment.ts ✅
├─ services/utils.ts ✅
└─ tasks/* ✅
```

### src/components/admin ✅
```
src/components/admin/
├─ AvailabilitySlotsManager.tsx ✅
��─ BookingSettingsPanel.tsx ✅
├─ RunRemindersButton.tsx ✅
├─ currency-manager.tsx ✅
├─ team-management.tsx ✅
├─ analytics/* ✅
├─ chat/AdminChatConsole.tsx ✅
├─ layout/* ✅ (Admin providers/layout)
├─ permissions/* ✅
├─ posts/* ✅
├─ providers/* ✅
├─ service-requests/* ✅
└─ services/* ✅
```

## Feature & Component Architecture
- Services: UI pages (services/page.tsx, services/list/page.tsx) use ListPage template and SWR to call /api/admin/services. Components under components/admin/services/* provide filters, forms, analytics, bulk actions.
- Bookings: admin/bookings UI maps to /api/admin/bookings with list/create/bulk-update/delete. Calendar/availability managed via availability-slots API and components/admin/AvailabilitySlotsManager.tsx.
- Service Requests: admin/service-requests pages list and manage items via /api/admin/service-requests* endpoints; charts/tables live in components/admin/service-requests/*.
- Tasks: rich module under admin/tasks with providers, hooks, many views (board, calendar, gantt, list, table). Talks to /api/admin/tasks* and streams/notifications.
- Users/Team: users pages use /api/admin/users (list) and /api/admin/users/[id] (PATCH). Team pages use /api/admin/team-members* and team-management/* read-only analytics.
- Analytics/Reports: pages pull /api/admin/analytics and /api/admin/stats/*; dashboard widgets under components/admin/analytics/*.
- Settings: booking and currency settings map to booking-settings/* and currencies/* APIs; BookingSettingsPanel component centralizes UI.
- Integrations/Uploads: admin/uploads/quarantine UI maps to uploads/quarantine API; integrations page is UI-only scaffold.
- Posts: admin/posts/page.tsx exists; uses non-admin /api/posts endpoints. ⚠️ Note: admin posts management relies on public posts API, consider /api/admin/posts for consistency.

Unused or duplicates:
- rbac.ts duplicates role/permission logic vs lib/permissions.ts ⚠️ Consider consolidating.
- layout-nuclear.tsx/page-nuclear.tsx/page-simple.tsx appear unused in routing ⚠️.
- tasks data fixtures and TODO files are dev artifacts ⚠️.

## Data Flow Architecture
- UI (React Server + Client components) → custom hooks (useSWR + domain hooks) → Next.js Route Handlers (src/app/api/admin/**) → Prisma ORM (src/lib/prisma.ts) → PostgreSQL.
- State management: SWR for fetching, optimistic mutate patterns; Context Providers in tasks module; zod validation server-side; WebSockets/SSE via lib/realtime(-enhanced) used for tasks and service-requests updates; Redis optional via cache.service/redis.ts.
- Libraries: Prisma (@prisma/client), Zod for schemas, NextAuth for auth; Sentry integrated in services API.

### Custom Hooks
- src/hooks/*:
  - useServicesData(options?): returns {services, loading, error}; fetches /api/admin/services; dependencies: apiFetch, SWR.
  - useAvailability(params): returns {data,isLoading,error,mutate}; GET /api/admin/service-requests/availability.
  - useBookings(params): returns {data,isLoading,error,mutate}; GET /api/admin/bookings.
  - useBooking(id, scope): returns {data,isLoading,error,mutate}; GET /api/{admin|portal}/service-requests.
  - useServiceRequests(params): returns {data,isLoading,error,mutate}; GET /api/admin/service-requests with query.
  - useServiceRequest(id): returns {data,isLoading,error,mutate}.
  - useClientNotifications(): session-aware notifications; depends on next-auth.
  - useOfflineQueue(pollInterval): expose queued count and processor.
  - useUnifiedData({key,params,...}): generic SWR wrapper that can parse and subscribe to realtime events.
  - useRealtime(eventTypes): local list of events via SSE/WebSocket adapter.
  - useServicesPermissions()/lib/use-permissions.ts: derive allowed actions from session role.
  - Admin hooks: usePerformanceMonitoring, usePerformanceAnalytics, useResponsive* — UI metrics/responsive classes.
- Tasks module hooks (src/app/admin/tasks/hooks):
  - useTaskActions(): {create(input), ...} → POST /api/admin/tasks
  - useTaskBulkActions(): {bulk(action, ids, updates?)} → POST /api/admin/tasks/bulk
  - useTaskAnalytics(): local loading + stats composition
  - useTaskFilters(tasks, filters): derive filtered list
  - useTaskPermissions(): reads session via next-auth to expose booleans
  - TaskProvider/useTasks(): context provider exposing task state

## API Architecture
- All admin handlers enforce session with getServerSession and role via lib/permissions.hasPermission; multi-tenancy headers applied by middleware and tenantFilter where used.
- Representative payloads/zod:
  - Service Requests (POST /api/admin/service-requests): union(CreateRequest | CreateBooking). Fields include clientId, serviceId, title?, description?, priority, budgetMin/Max, attachments, isBooking?, scheduledAt?, duration?, clientName/Email/Phone?, bookingType?, recurringPattern?. Returns created entity; may auto-assign and emit realtime.
  - Tasks (POST /api/admin/tasks): {title, priority?, status?, dueAt?, assigneeId?}. PATCH /[id]: any subset; DELETE /[id].
  - Services: GET with filters {search, category, featured, status, limit, offset, sortBy, sortOrder}; POST validates ServiceSchema; [id] supports GET/PATCH/DELETE. HEAD supported for list caching.
  - Availability Slots: GET filters {serviceId, teamMemberId, date}; POST/PUT/DELETE manage slots.
  - Users: GET list; PATCH /users/[id] with userUpdateSchema (name, email, role).
  - Bookings: GET with {limit, offset, status, search, startDate, endDate, sortBy, sortOrder}; POST create; PATCH bulk actions (confirm/cancel/complete/update); DELETE bulk.
  - Stats/Analytics: GET-only, return numeric aggregates; some placeholders for revenue using duration.

Complete route list with methods: see tree above.

## Routes and Imports
- Mapping examples:
  - /admin/services → components/admin/services/* → /api/admin/services*
  - /admin/service-requests → components/admin/service-requests/* → /api/admin/service-requests*
  - /admin/tasks → admin/tasks/components/* → /api/admin/tasks*
  - /admin/bookings → dashboard lists → /api/admin/bookings*
  - /admin/users → dashboard lists → /api/admin/users, /api/admin/users/[id]
  - /admin/uploads/quarantine → QuarantineClient → /api/admin/uploads/quarantine
- Posts: /admin/posts UI uses non-admin /api/posts* endpoints ⚠️ consider /api/admin/posts for consistency.
- Imports checked on sampled files compile; notable duplication: lib/rbac.ts vs lib/permissions.ts both export hasPermission ⚠️.
- Database connections: Real Prisma used broadly; where DB missing, explicit dev fallbacks (lib/dev-fallbacks.ts, tasks/users routes) are guarded by env checks.

## Integration Points
- Environment variables observed: DATABASE_URL/NETLIFY_DATABASE_URL, NEXTAUTH_SECRET/NEXTAUTH_URL, SENTRY_DSN, REDIS_URL, UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN, EXCHANGE_BASE_CURRENCY/EXCHANGE_API_PROVIDER/EXCHANGE_RATE_TTL_SECONDS, CRON_SECRET/NEXT_CRON_SECRET, SENDGRID_API_KEY/FROM_EMAIL/ADMIN_EMAIL, REALTIME_* (PG channel/url/transport), STRIPE_* keys, UPLOADS_PROVIDER/NETLIFY_BLOBS_TOKEN/UPLOADS_AV_SCAN_URL/UPLOADS_AV_API_KEY/CLAMAV_API_KEY, MULTI_TENANCY_ENABLED, NEXT_PUBLIC_*
- External services: Prisma (Postgres/Neon), NextAuth, Redis (ioredis/Upstash), Sentry, SendGrid, Netlify Blobs, Stripe readiness.
- Module dependencies: Bookings ↔ Service Requests (booking-type SR), SR ↔ Tasks (requestTasks), SR ↔ Reminders/Cron, Services ↔ Pricing/Exchange, Roles/Permissions pervasive via lib/permissions.

## Security & Permissions
- Middleware enforces: /admin requires authenticated staff roles (ADMIN, TEAM_LEAD, TEAM_MEMBER); /portal requires auth.
- API authorization: Every admin route samples checked call getServerSession and hasPermission with PERMISSIONS constants; tenants enforced via tenantFilter.
- Risks:
  - lib/rbac.ts exports a different hasPermission signature than lib/permissions.ts ⚠️ could cause accidental misuse; prefer one source (permissions.ts).
  - Some endpoints fall back to demo data when DB unavailable; ensure disabled in production.
  - SSE/stream/realtime endpoints should validate auth per-connection; confirm in those files.

## Performance & Testing
- Potential N+1:
  - /api/admin/currencies/route.ts fetches exchangeRate per currency in a loop ⚠️. Consider a single query for latest rates grouped by target or a join.
- Pagination/filters: Implemented in services, bookings, service-requests, users, availability-slots; consistent use of limit/offset and safe sort allowlists.
- Prisma efficiency: Aggregations used for stats; many list endpoints include minimal selects.
- Tests:
  - Unit/integration: src/app/admin/tasks/tests/* cover routes, hooks, components.
  - Repo-level tests and e2e present under tests/ and e2e/.

## Cleanup Notes
- Consolidate RBAC: Remove or deprecate src/lib/rbac.ts in favor of src/lib/permissions.ts ⚠️.
- Remove alt/unused layouts/pages if not referenced: layout-nuclear.tsx, page-nuclear.tsx, page-simple.tsx ⚠️.
- Remove dev artifacts in admin/tasks (TODO+log.md, data/comments/1.json) from production bundles ⚠️.
- Posts admin uses public posts API; add admin-scoped API or ensure auth/tenant guards on current routes.
- Review realtime endpoints (tasks/stream, admin/realtime) for strict auth and tenant scoping.
- Optimize currencies rates query (batch the rate lookup).

---

Appendix: Selected Schemas
```ts
// Service Requests create (union)
CreateRequest: { clientId, serviceId, title?, description?, priority, budgetMin?, budgetMax?, requirements?, attachments?, assignedTeamMemberId? }
CreateBooking:  CreateRequest & { isBooking: true, scheduledAt: string, duration?, clientName?, clientEmail?, clientPhone?, bookingType?, recurringPattern? }
```
```ts
// Tasks create/update
Create: { title: string, priority?: LOW|MEDIUM|HIGH|critical, status?: OPEN|IN_PROGRESS|DONE|pending|in_progress|completed, dueAt?: ISO, assigneeId?: string }
Update: Partial<Create>
```
```ts
// Services list filters
{ search?, category?, featured?: 'all'|true|false, status?: 'all'|..., limit?: number, offset?: number, sortBy?: 'updatedAt'|..., sortOrder?: 'asc'|'desc' }
```
