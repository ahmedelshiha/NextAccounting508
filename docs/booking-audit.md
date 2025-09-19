# Booking ⇄ Service Request Integration Audit

Owner: admin (fsfsfsy2drad7@tuta.io)
Date: 2025-09-19

This report audits the Booking feature across the codebase with a focus on how it integrates (now and suggested) with the Service Request module. It covers code locations, architecture, data flow, API surface, business rules, security, testing, performance, and pragmatic recommendations for integrating Bookings with Service Requests.

---

## Overview

Purpose
- Booking enables clients to request appointments for Services offered by the firm. It supports public booking flows, a client portal to manage appointments, and an admin interface for staff to manage, confirm, assign, and bulk-operate on bookings.

High-level features
- Public booking flow: src/app/booking/page.tsx — multi-step wizard to pick service, date/time, client info and submit a booking request.
- Portal (client): src/app/portal/bookings/** — list + detail pages for clients to view and cancel their bookings.
- Admin: src/app/admin/bookings/** — management dashboard, create booking wizard, detail view, analytics, bulk operations.
- APIs: src/app/api/bookings/** (and src/app/api/admin/bookings) expose CRUD, availability, confirmation and admin operations.

Current integration with other modules
- Users: Booking.clientId relation to User model; ownership and role checks enforce who can view/update bookings.
- Services: Booking.serviceId relation to Service; duration and price are read from Service records across UI and availability logic.
- Notifications: Email confirmation + ICS via src/lib/email.ts; cron reminders via src/lib/cron.ts.
- Tasks/Service Requests: Admin booking detail can create Tasks (via /api/admin/tasks) and the codebase includes ServiceRequest model, but there is no direct DB relation between Booking and ServiceRequest. Some task adapters/types allow optional bookingId fields.
- Payments: No payments/invoices lifecycle tied to Booking currently — Service price displayed, but Payment tables/models are not integrated with Booking flows.

High-level risk summary
- No Zod or schema-based validation in booking APIs (validation is manual and minimal).
- Mixed data-access patterns (API routes vs direct Prisma usage in server components) increases duplication and inconsistent RBAC.
- Availability logic is simplistic and not integrated with ServiceRequest assignment or team availability.

---

## Complete Current Directory Structure (Booking-relevant)

src/app/
- booking/page.tsx (public booking wizard)
- portal/bookings/page.tsx (client list) ✅
- portal/bookings/[id]/page.tsx (client detail — server component using direct Prisma) ⚠️ (bypasses API)
- admin/bookings/page.tsx (admin dashboard — large composite component) ✅
- admin/bookings/new/page.tsx (admin new booking wizard) ✅
- admin/bookings/[id]/page.tsx (admin booking detail + assignment) ✅

src/app/api/
- bookings/route.ts (GET list, POST create) ✅
- bookings/[id]/route.ts (GET, PUT, DELETE) ✅
- bookings/[id]/confirm/route.ts (POST confirm + send confirmation) ✅
- bookings/availability/route.ts (GET availability slots) ✅
- admin/bookings/route.ts (GET list create bulk PATCH DELETE) ✅
- admin/stats/bookings/route.ts (analytics) ✅

src/lib/
- prisma (Prisma client used across APIs) ✅
- email.ts (sendBookingConfirmation, sendBookingReminder) ✅
- cron.ts (sendBookingReminders, updateBookingStatuses) ✅
- api.ts (apiFetch helper used by frontend) ✅
- api-response.ts (respond helper — currently not used by booking routes) ⚠️
- rbac/permissions helpers (hasPermission) ✅

prisma/
- schema.prisma: model Booking, Service, User, TeamMember, ServiceRequest exist ✅

Notes
- Files marked ⚠️ indicate code smell or misplaced patterns: portal detail SSR uses Prisma directly (bypasses API + respond patterns), api-response util is not used by booking routes producing inconsistent responses.
- Shared UI components (Card, Table, Select, Button) in src/components/ui are reused across admin/portal pages — marked ✅.

---

## Component Architecture Details

List of React components and roles (Booking area):

- src/app/booking/page.tsx
  - BookingPage (client wizard)
  - responsibilities: select service → choose date/time (calls /api/bookings/availability) → client info → POST /api/bookings
  - Uses: apiFetch, UI components (Card, Button, Input)

- src/app/portal/bookings/page.tsx
  - PortalBookingsPage (CSR): fetches /api/bookings for session user, renders list cards and summary
  - uses apiFetch via fetch() and components/ui Card/Button

- src/app/portal/bookings/[id]/page.tsx
  - PortalBookingDetail (server component): uses getServerSession + direct prisma.booking.findUnique
  - role: secure server-side page rendering of booking detail for client
  - Concern: bypasses the /api/bookings/:id endpoint

- src/app/admin/bookings/page.tsx
  - EnhancedBookingManagement (client): comprehensive admin dashboard — filters, analytics, table & card views, bulk actions
  - Large file that combines many UI responsibilities — candidate to split into smaller components

- src/app/admin/bookings/new/page.tsx
  - ProfessionalNewBooking (client): admin multi-step new booking wizard (client select, service select, scheduling, details, review)
  - Uses fetch('/api/services'), fetch('/api/admin/users'), POST /api/bookings

- src/app/admin/bookings/[id]/page.tsx
  - AdminBookingDetailPage (client): fetches /api/bookings/:id via apiFetch, allows status update, adminNotes update, assign team member
  - Supports creating related tasks via /api/admin/tasks

Shared/inline components inside admin page
- Filters, Selectors, SchedulingSection, ServiceSelector, ClientSelector are defined inside new/page.tsx — should be extracted to components/admin/bookings/* for reuse and testability.

Unused/duplicate components
- There are no obvious 1:1 duplicate files, but functionality is duplicated: PortalBookingDetail and API GET /api/bookings/[id] both fetch same data — consider consolidating to API-only access or service layer.

---

## Data Models (Prisma)

Prisma excerpt (Booking model) — from prisma/schema.prisma:

model Booking {
  id          String        @id @default(cuid())
  clientId    String
  serviceId   String
  status      BookingStatus @default(PENDING)
  scheduledAt DateTime
  duration    Int
  notes       String?       @db.Text
  clientName  String
  clientEmail String
  clientPhone String?
  adminNotes  String?       @db.Text
  confirmed   Boolean       @default(false)
  reminderSent Boolean      @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  assignedTeamMemberId String?
  assignedTeamMember   TeamMember? @relation(fields: [assignedTeamMemberId], references: [id], onDelete: SetNull)

  client  User    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  service Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@map("bookings")
}

Related models (high level)
- User: id, email, name, role (UserRole enum), bookings relation
- Service: id, name, price (Decimal), duration (Int), active Boolean
- TeamMember: id, name, userId?, isAvailable
- ServiceRequest: separate model (ServiceRequest) exists with relations to Service and User but currently no link to Booking

Computed/virtual fields used in UI
- The admin UI renders fields that are not stored on Booking (priority, location, client.tier) — these are UI-only/enriched fields computed or synthesized by admin page logic.

---

## Data Flow Architecture

Typical flows
- Public booking submit:
  BookingPage -> apiFetch('/api/bookings', POST) -> server handler (validate minimal fields, conflict-check via prisma) -> prisma.booking.create

- Availability flow:
  BookingPage -> apiFetch('/api/bookings/availability?serviceId=...&date=...') -> route generates time slots by comparing existing bookings from Prisma

- Portal detail (server-only): portal/bookings/[id]/page.tsx calls prisma.booking.findUnique directly using getServerSession for auth

- Admin operations:
  Admin UI -> apiFetch('/api/admin/bookings') or /api/bookings/:id -> server routes -> prisma queries

State management
- Mostly local React state (useState/useEffect) on pages. No SWR/React-Query used for booking data. apiFetch provides retry/timeouts but not caching.

Caching, optimistic updates, realtime
- No built-in optimistic updates in booking flows.
- No WebSocket subscriptions found for realtime booking updates.
- Cron jobs handle reminders and status updates (src/lib/cron.ts).

Implication for Service Request integration
- Because the admin portal uses client-side polling (auto-refresh) and local transforms, a unified service layer (src/lib/bookings) would make integration simpler: both API routes and server components (SSR) should call the same service functions.

---

## Custom Hooks

Current state
- There are no dedicated shared hooks named useBookings or useBooking in src/hooks. Some ad-hoc useBookings functions appear inline in task-related components but are local to those files.
- Examples found: local `function useBookings()` inside task-related pages (duplicated implementations)

Recommendation hooks (to implement)
- useBookings({ params }) -> { data, loading, error, refresh, nextPage }
  - Output: { bookings: Booking[], total?: number, loading, error, refresh }
- useBooking(id) -> { data, loading, error, updateStatus }
- useAvailability(serviceId, date, days) -> { availability, loading }

Hook TypeScript signature example

```ts
// src/hooks/bookings/useBooking.ts
export function useBooking(id: string) {
  const [data, setData] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => { /* fetch /api/bookings/${id} */ }, [id])
  return { data, loading, error, refresh: () => {} }
}
```

---

## API Architecture (Endpoints)

List (from src/app/api/bookings/**)

- GET /api/bookings
  - Purpose: List bookings; filters: status, userId. Role-filtered: CLIENT sees own bookings.
  - Response: array of bookings (no wrapper), include client and service info.
  - Issues: no pagination, inconsistent response shape vs admin endpoints.

- POST /api/bookings
  - Purpose: Create booking (clients and admin/staff allowed); minimal validation (serviceId, scheduledAt, clientName, clientEmail required)
  - Behavior: verify service active, check conflicts (1-hour buffer), create booking as PENDING; admin/staff can supply clientId
  - Response: created booking (includes service and assignedTeamMember)

- GET /api/bookings/availability
  - Purpose: Return available slots over date range given service duration; business hours hard-coded 9-17; 30-min interval.
  - Response: { serviceId, duration, availability: [ { date, slots: [ { start, end, available } ] } ] }

- GET /api/bookings/[id]
  - Purpose: Get single booking with relations. Role checks: CLIENT can only view their bookings.

- PUT /api/bookings/[id]
  - Purpose: Update booking. Admin/Staff: update status, scheduledAt, adminNotes, confirmed, assignedTeamMember. Owner (client): update notes and reschedule (if not confirmed).
  - Uses partial updates via Prepared `updateData` object.

- DELETE /api/bookings/[id]
  - Purpose: Cancel booking — sets status CANCELED (no hard delete).

- POST /api/bookings/[id]/confirm
  - Purpose: Admin confirm booking and send confirmation email with ICS attachment.

- Admin endpoints: /api/admin/bookings (GET, POST, PATCH, DELETE)
  - GET supports pagination (limit, skip), search, date filters.
  - POST creates confirmed bookings (admin-created) and can accept clientId or clientName/email for guest bookings.
  - PATCH bulk actions (confirm/cancel/complete/update)
  - DELETE bulk delete bookings

Auth & Authorization patterns
- Most endpoints call getServerSession(authOptions) and check role.
- Admin endpoints use hasPermission(session.user.role, PERMISSIONS.TEAM_MANAGE).
- Portal SSR page uses getServerSession + enforces owner check; this is good but duplicate logic.

Validation
- Validation is manual: required field checks, service active check, basic conflict detection.
- No Zod-based schemas present for booking requests.

Response shapes
- Booking endpoints return raw Prisma objects or arrays; admin endpoints return object with { bookings, total, page, totalPages } — inconsistent with api-response helper.

---

## Business Rules & Validation

Observed business rules
- Booking creation checks: service must exist and be active, scheduledAt presence, no overlapping booking found using a simple window (1 hour buffer) and status in [PENDING, CONFIRMED].
- Availability generation enforces business hours 9:00–17:00, 30 minute slots, skips weekends.
- Admin-created bookings are automatically CONFIRMED.
- Cancellation sets Booking.status = CANCELLED rather than deleting.
- Confirmation triggers sendBookingConfirmation email and sets confirmed flag.
- Cron updates: reminders for tomorrow's confirmed bookings (then set reminderSent = true), and update past confirmed bookings to COMPLETED.

Validation coverage
- Frontend: booking wizard validates required fields client-side (clientName/email/time/service). Availability API is used but fallback to random slots if API fails.
- Backend: server performs presence checks and service existence check; no strong schema validation and no typed error responses.

Status transitions
- PENDING -> CONFIRMED (admin or confirm API) -> COMPLETED (cron or admin) or CANCELLED
- Clients can reschedule only if not confirmed

Gaps
- No explicit rate-limiting or abuse protection on booking creation.
- Availability conflict logic may allow edge-case overlaps due to buffer and rounding.

---

## Integration Points (with Service Request module)

Current state
- ServiceRequest model exists and is conceptually related (client, service, assignedTeamMember, request tasks), but there is no direct relationship (foreign key) between Booking and ServiceRequest.
- Some task creation flows in admin booking detail create tasks related to bookings via /api/admin/tasks — this demonstrates a loose coupling approach using tasks as integration glue.

Potential integration patterns
1) Lightweight link (recommended first step)
  - Add optional serviceRequestId to Booking (nullable FK) so a booking can reference a ServiceRequest when the appointment is created as part of a larger service request.
  - Use when a client books an appointment that is created from a ServiceRequest page or when staff schedule work to discuss a ServiceRequest.
  - Minimal DB change: add serviceRequestId String? and @relation to ServiceRequest.

2) Two-way synchronization / events
  - When Booking confirmed, emit an event (internal service layer) that updates ServiceRequest status (e.g., mark 'scheduled' or add audit comment).
  - Cron or background job to reconcile bookings and service requests (e.g., if a booking completes, mark ServiceRequest step progressed).

3) Reuse Booking service layer for availability
  - ServiceRequest scheduling could reuse /api/bookings/availability with team-member aware availability (future enhancement).

Files/places to hook into for integration
- Add serviceRequestId migration in prisma/schema.prisma and use in:
  - src/app/api/bookings/route.ts (POST create — accept optional serviceRequestId)
  - src/app/admin/bookings/new/page.tsx and admin booking detail (allow linking to a service request)
  - src/lib/cron.ts / src/lib/bookings service layer to reconcile states

Suggested code snippet — API payload change (POST /api/bookings)

```ts
// request body type (server)
interface CreateBookingPayload {
  serviceId: string
  scheduledAt: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  notes?: string
  assignedTeamMemberId?: string | null
  serviceRequestId?: string | null // NEW
}
```

Suggested code snippet — Booking service helper

```ts
// src/lib/bookings.ts (new)
export async function createBooking(data: CreateBookingPayload, actorId?: string) {
  // validate service, conflict check, optionally link serviceRequest, create booking, audit log
}
```

---

## Security & Permissions

Roles
- UserRole enum includes CLIENT, TEAM_MEMBER, STAFF, TEAM_LEAD, ADMIN.
- AuthN via next-auth (credentials provider) with Prisma adapter when DB is present.
- Authorization: getServerSession + role checks in endpoints; admin endpoints call hasPermission(..., PERMISSIONS.TEAM_MANAGE).

Sensitive data
- Booking stores clientName and clientEmail, and optionally phone — treat as PII.
- Logging occasionally prints booking counts; avoid printing PII in logs.

Input sanitization
- Minimal sanitization performed. Recommend central Zod schemas for all APIs and use respond helper for consistent error responses.

Gaps
- No rate-limiting on booking creation.
- portal booking SSR bypasses API-level authorization wrappers (but still checks session) — consolidation recommended.

---

## Testing Coverage

Findings
- No tests specifically targeting booking APIs or availability flows in tests/ (grep returned none for booking tests).
- There are tests for other modules but Booking endpoints, availability logic, and confirmation flows are untested.

Priorities
- Add unit tests for availability algorithm edge cases (overlapping bookings, DST boundaries, holiday exclusion).
- Add integration tests for POST /api/bookings (conflict behavior), PUT status transitions, POST confirm (email sending should be mocked).
- Add E2E tests for public booking wizard (happy path + validation failures).

---

## Performance Considerations

Database
- Add indexes: scheduledAt, status, clientId, serviceId will improve list & availability queries.
- For large datasets, /api/bookings must support pagination, limit, skip, and order.

API & UI
- Heavy admin page (src/app/admin/bookings/page.tsx) should be split and memoized; move expensive mapping out of render path.
- Consider SWR/React Query for admin data to enable caching, stale-while-revalidate, and optimistic updates.

Availability
- Cache computed availability per service/day range; invalidate on create/update of bookings for the same service/day.

---

## Cleanup Notes & Actionable TODOs

Short-term (quick wins)
- Standardize API responses: adopt src/lib/api-response.respond across booking routes for consistent shapes.
- Centralize booking logic: create src/lib/bookings.ts to house create/list/get/update/cancel/availability/conflict checks.
- Replace ad-hoc Prisma access in portal SSR with calls to unified service layer or server fetch to /api/bookings/:id.
- Add Zod validation schemas for request bodies and query params.

Medium-term
- Add serviceRequestId FK to Booking and migration to allow linking Bookings to ServiceRequests.
- Implement hooks (useBookings/useBooking/useAvailability) and refactor admin/portal pages to use them.
- Add unit & integration tests for booking flows and availability.

Long-term
- Improve availability engine: respect team-member working hours, holidays, multi-tenant business hours config.
- Add payment lifecycle (Payment/Invoice models) and tie to booking when payments required.
- Add eventing (webhooks or domain events) to synchronize Booking <-> ServiceRequest state changes.

Suggested PR tasks (concrete)
1. Create src/lib/bookings.ts and move conflict & creation logic there; update API routes to use it.
2. Add Zod schemas in src/lib/schemas/bookings.ts and validate in routes.
3. Add optional serviceRequestId to Booking model and write a migration; wire the field into create/update flows.
4. Extract admin page subcomponents to src/components/admin/bookings/* and create unit tests for each.
5. Add tests: tests/api-bookings.* (vitest) covering create, conflict, update, cancel, confirm.

---

## Appendix: Useful code snippets

API signatures (examples)

```ts
// src/app/api/bookings/route.ts
export async function GET(request: NextRequest) {
  // returns Booking[] or NextResponse.json({ error })
}

export async function POST(request: NextRequest) {
  // accepts JSON body with serviceId, scheduledAt, clientName, clientEmail, ...
}
```

Booking creation payload (server-side TypeScript)

```ts
type CreateBookingPayload = {
  serviceId: string
  scheduledAt: string
  notes?: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  assignedTeamMemberId?: string | null
  serviceRequestId?: string | null
}
```

Service-layer create interface (recommended)

```ts
async function createBooking(payload: CreateBookingPayload, actorId?: string) : Promise<Booking> {
  // validate, check conflicts, create booking, audit
}
```

---

File saved at: docs/booking-audit.md

If you want, I can:
- Implement the recommended src/lib/bookings.ts service layer and migrate one API route to use it.
- Add Zod schemas and wire them into the API handlers.
- Create the DB migration to add serviceRequestId to Booking (PR + migration file).

Which of the follow-up tasks would you like me to start with? (pick one: service layer, validation, migration, tests, or UI refactor)
