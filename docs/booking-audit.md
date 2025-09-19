# Booking Module Audit

Owner: admin (fsfsfsy2drad7@tuta.io)
Date: {{today}}

## 1) Overview
- Purpose: Enable clients to request/ book services and staff to manage appointments.
- Relationships:
  - Users: Booking.clientId → User.id. RBAC used via next-auth and lib/permissions.
  - Services: Booking.serviceId → Service.id (duration/price source).
  - Notifications: Email confirmations (ICS) and reminder cron jobs.
  - Tasks: Admin booking pages can create related Tasks; no strict DB linkage.
  - Payments: Price displayed from Service; no payment/invoice models integrated.
- High-level risks:
  - Inconsistent API response shapes; some endpoints return arrays, others objects; respond util unused.
  - Minimal input validation (no Zod), risk of malformed data.
  - Mixed data access patterns (API routes vs direct Prisma in pages) → duplication, harder RBAC/tenancy.
  - No pagination in /api/bookings; potential overfetch in portals.
  - Multi-tenant filters referenced in analytics, but Booking model lacks tenantId field.

## 2) Directory Structure
- UI
  - src/app/booking/page.tsx (public booking flow)
  - src/app/portal/bookings/page.tsx (portal list)
  - src/app/portal/bookings/[id]/page.tsx (server component, direct Prisma fetch)
  - src/app/admin/bookings/page.tsx (admin dashboard)
  - src/app/admin/bookings/new/page.tsx (admin new booking)
  - src/app/admin/bookings/[id]/page.tsx (admin booking detail)
- API
  - src/app/api/bookings/route.ts (GET list; POST create)
  - src/app/api/bookings/[id]/route.ts (GET one; PUT update; DELETE cancel)
  - src/app/api/bookings/[id]/confirm/route.ts (POST confirm + email)
  - src/app/api/bookings/availability/route.ts (GET slots)
  - src/app/api/admin/bookings/route.ts (admin list/create/bulk ops)
  - src/app/api/admin/stats/bookings/route.ts (analytics)
- Shared/Integrations
  - prisma/schema.prisma (Booking model)
  - src/lib/email.ts (ICS + emails)
  - src/lib/cron.ts (reminders/status updates)
  - src/lib/api.ts (apiFetch)
  - src/lib/api-response.ts (response helper; currently not used in booking routes)

Observations:
- Potentially unused/duplicate:
  - Admin UI synthesizes properties (priority, tier, location) not in DB → simulated UI-only fields.
  - Both portal booking detail and API endpoint provide same data; duplication of logic.
- Misplaced/mixed concerns:
  - Portal booking detail uses direct Prisma in a route component, bypassing API and respond helper.
  - Admin analytics route applies tenantFilter to Booking, but Booking has no tenantId.

## 3) Component Architecture
- Booking flow (public): src/app/booking/page.tsx
  - Steps: service select → date/time → info → success.
  - Uses apiFetch('/api/services') and /api/bookings/availability → /api/bookings POST.
- Portal
  - List: src/app/portal/bookings/page.tsx (CSR fetch /api/bookings, role-filtered server side).
  - Detail: src/app/portal/bookings/[id]/page.tsx (SSR; direct Prisma + server session).
- Admin
  - Dashboard: src/app/admin/bookings/page.tsx (large component; filters, tables, cards; bulk actions hitting /api/admin/bookings).
  - New: src/app/admin/bookings/new/page.tsx (multi-step wizard; posts to /api/bookings with assignedTeamMemberId, client info).
  - Detail: src/app/admin/bookings/[id]/page.tsx (CSR; calls /api/bookings/:id for data; update, assign, notes).

Large/complex components to split:
- src/app/admin/bookings/page.tsx: >1000 LOC responsibilities (filters, table, cards, analytics, exports). Split into:
  - AdminBookingsFilters, AdminBookingsTable, AdminBookingsCards, AdminBookingsHeader, AdminBookingsAnalytics, useAdminBookings hook.
- src/app/admin/bookings/new/page.tsx: split selectors and sections into isolated components/hooks.

Shared UI patterns:
- Uses components/ui (Button, Card, Select, Badge, Tabs, Table). Reuse looks consistent.

## 4) Data Flow Architecture
- Sources: Prisma models (Booking, Service, User); external: SendGrid for email.
- Flow:
  - DB → API routes (RBAC, minimal validation) → frontend via apiFetch.
  - Exception: portal booking detail SSR hits Prisma directly.
- State management: Local useState; no SWR/React Query. apiFetch has retry/timeout.
- Bottlenecks:
  - /api/bookings lacks pagination and sorting controls; portal lists can grow unbounded.
  - Availability is naive: fixed business hours, ignores team availability/holidays; conflict detection is approximate.
  - Conflicting booking check in POST uses 1h buffer and time window compare; could allow overlaps across services/teams.

## 5) Custom Hooks
- No dedicated bookings hooks (only internal ad-hoc hooks under tasks). Recommend:
  - src/hooks/bookings/useBookings.ts (list with filters, pagination).
  - src/hooks/bookings/useBooking.ts (fetch single).
  - src/hooks/bookings/useAvailability.ts.
  - Cover loading, error, retries.

## 6) API Architecture
- Style: RESTful Next.js route handlers.
- Endpoints: as listed in section 2.
- Validation: Basic manual checks; no Zod schemas; types inferred loosely. Recommend Zod for Create/Update/Query.
- Error handling: Ad-hoc JSON with { error }; not using respond helper; shapes vary (arrays vs objects).
- Security:
  - Auth: getServerSession checks on all mutations and most reads (availability is public).
  - Authorization: role/permission checks; admin uses hasPermission(PERMISSIONS.TEAM_MANAGE).
  - Input sanitization: none beyond presence checks.
  - Tenancy: analytics route uses tenantFilter against Booking without tenantId; ineffective.

## 7) Integration Points
- Users: client ownership enforced in GET /api/bookings and [id] routes; portal SSR enforces ownership.
- Payments: none implemented; price read from Service only.
- Notifications: sendBookingConfirmation on confirm; cron sendBookingReminders and status updates.
- Calendar: ICS attachment; no external calendar webhook.
- Coupling: Email/cron are modular; booking UI simulates fields not in schema → leaky boundaries.

## 8) Testing & QA
- No booking-specific tests found under tests/.
- Existing infra: vitest setup present; other modules covered.
- CI/CD: Not visible here; package.json scripts exist.
- Mocking: None for bookings; apiFetch not mocked.

## 9) Performance Audit
- DB:
  - Booking has no indexes; add indexes on (scheduledAt), (status), (clientId), (serviceId).
  - Conflict queries and stats would benefit from indexes.
- API:
  - Add pagination/sorting to /api/bookings; limit fields for portal list.
  - Cache availability results per service/date range; ETag/Cache-Control for public route.
- Client:
  - Portal list CSR only; consider SSR or SWR with revalidate.
  - Lazy-load admin analytics/cards; memoize heavy computations; component split.

## 10) Security Audit
- AuthN: Session validated across endpoints; good.
- AuthZ: Owner checks for clients; admin permissions enforced in admin routes; good.
- Input validation: Missing; add Zod and centralized validation + respond helper.
- Sensitive data: Emails include client details; avoid logging PII; console logs in cron may leak counts only (ok). Ensure SENDGRID keys via env.
- Multi-tenant: Inconsistent; tenantFilter used where model lacks tenantId; fix strategy.

## 11) Maintainability & Scalability
- Duplication: Portal detail SSR vs API detail; unify via API.
- Shared libs: Create src/lib/bookings for service layer (availability, conflict checks, RBAC, validation) used by routes and SSR.
- Folder consistency: mirror service-requests pattern (templates, notifications).
- Scale features: multi-tenant support; feature flags for payments/integrations; background jobs queue for emails.

## 12) Action Plan (Keepers, Issues, TODOs)

### ✅ Keepers
- Clear REST endpoints covering CRUD and confirmation flow.
- Email confirmation with ICS and reminder cron.
- Admin bulk operations and stats endpoint.
- apiFetch with retries/timeouts.

### ❌ Issues
- Inconsistent response shapes; respond helper unused.
- No Zod validation; weak input checks; enum casts from strings.
- Mixed Prisma-in-page vs API fetching (portal detail).
- /api/bookings missing pagination/sorting; potential overfetch.
- Admin stats tenantFilter applied to Booking without tenantId.
- Availability algorithm simplistic; business hours hard-coded; ignores team availability.
- Admin UI synthesizes fields (priority, tier, location) not persisted; can mislead users.

### 🔜 TODOs (prioritized)
1) API consistency & validation
- Adopt respond helper across booking routes; standardize { success, data }.
- Add Zod schemas: BookingCreateSchema, BookingUpdateSchema, QuerySchema; validate and map errors via zodDetails.

2) Pagination/filters
- Add take/skip/sort/status/date filters to /api/bookings; enforce sensible defaults and max limits.

3) Data access unification
- Refactor portal booking detail to call /api/bookings/[id] via server action/fetch, not direct Prisma.
- Extract a service layer in src/lib/bookings (getById, list, create, update, cancel, confirm, availability, conflictCheck).

4) Multi-tenant correctness
- Decide tenancy model: add tenantId to Booking or derive via Service. Then update queries and admin stats accordingly.

5) DB performance
- Add Prisma indexes:
  - @@index([scheduledAt])
  - @@index([status])
  - @@index([clientId])
  - @@index([serviceId])

6) Availability improvements
- Parameterize business hours/interval; exclude holidays; respect assignedTeamMember availability; reuse conflictCheck.
- Cache availability per service/date range.

7) Testing
- Add tests:
  - bookings.route (GET list; POST create with conflict; PUT update; DELETE cancel; confirm email mocked).
  - availability.route (edge dates, conflict cases).
  - admin.bookings.route (pagination, bulk ops; permission guards).

8) Security
- Add input sanitization and stricter type guards; limit fields in responses for client role.
- Rate-limit booking creation/availability endpoints.

9) UI refactors
- Split admin bookings page into smaller components; introduce useAdminBookings hook.
- Extract reusable components for filters/table/cards to components/admin/bookings/.
- Replace simulated fields with persisted equivalents or clearly mark as UI-only.

10) Roadmap
- Payments: add Payment/Invoice models and integrate with booking lifecycle.
- Notifications: webhook integration for calendars; cancellation/reschedule flows with audit logs.

---

Appendix A — Booking Model (prisma/schema.prisma)
- Fields: id, clientId, serviceId, status (PENDING|CONFIRMED|COMPLETED|CANCELLED), scheduledAt, duration, notes, clientName, clientEmail, clientPhone, adminNotes, confirmed, reminderSent, assignedTeamMemberId, timestamps.

Appendix B — Endpoints
- GET/POST /api/bookings
- GET/PUT/DELETE /api/bookings/[id]
- POST /api/bookings/[id]/confirm
- GET /api/bookings/availability
- GET/POST/PATCH/DELETE /api/admin/bookings
- GET /api/admin/stats/bookings
