# Client Portal Audit

1. Overview

Purpose
- The Client Portal provides authenticated customers a secure interface to create and track Service Requests and Bookings, manage preferences, receive realtime updates, and chat with the team.

Key Features
- Service Requests: list, detail, create (standard or booking), comment, confirm/reschedule linked bookings, CSV export.
- Bookings: upcoming/past appointments view and cancellation from dashboard.
- Preferences: user-level booking preferences (email/sms reminders, time zone, language).
- Realtime: SSE/WS-driven updates for SR changes, availability, and chat.
- Offline/PWA: background sync queue for SR submissions when offline (optional).

How Portal differs from Admin
- Audience: Portal is for CLIENT users; Admin is for STAFF (TEAM_MEMBER/TEAM_LEAD/ADMIN).
- Scope: Portal data is strictly scoped to the logged-in user (clientId), optional tenant isolation; Admin manages all tenant data and operations.
- Overlap: Shared APIs/services for availability, pricing, realtime, and some UI primitives; Portal reuses hooks/utilities (apiFetch, SWR, realtime) and shares ServiceRequest/Booking models.

2. Complete Current Directory Structure

src/app/portal (pages)
- page.tsx — Portal dashboard (welcome, quick actions, upcoming/past appointments). Fetches /api/bookings; provides CSV export and cancel.
- bookings/
  - page.tsx — Bookings list (client view) [Present; minimal; leverages common hooks/UI].
  - [id]/page.tsx — Booking details view.
  - new/page.tsx — Booking creation flow entry (links into booking wizard experience).
- service-requests/
  - page.tsx — Service Requests list (client scope) + Suspense wrapper.
  - ServiceRequestsClient.tsx — Client component: filters, pagination, tabs (all/requests/appointments), CSV export, realtime refresh, optional offline queue indicator.
  - [id]/page.tsx — Service Request details page (client scope).
  - new/page.tsx — Create a new Service Request (client scope).
- settings/page.tsx — Portal user settings page (booking preferences, etc.).

src/app/api/portal (API routes)
- chat/route.ts — POST send chat message; GET list recent messages.
- realtime/route.ts — SSE stream for realtime events for portal users.
- service-requests/route.ts — GET list SRs scoped to client; POST create SR/Booking (idempotent + ratelimited).
- service-requests/[id]/route.ts — GET single SR (client-owned); PATCH limited updates (cancel/approve/description).
- service-requests/[id]/comments/route.ts — GET/POST comments on a client-owned SR.
- service-requests/[id]/confirm/route.ts — POST confirm a linked booking.
- service-requests/[id]/reschedule/route.ts — POST reschedule a linked booking (conflict-checked).
- service-requests/availability/route.ts — GET availability window for a service (optionally includes price breakdowns).
- service-requests/export/route.ts — GET CSV export of client-owned SRs.
- settings/booking-preferences/route.ts — GET/PUT current user’s booking preferences.

src/components/portal (reusable components)
- LiveChatWidget.tsx — Floating chat widget with SSE, backlog, and offline queue flush.
- OfflineQueueInspector.tsx — Inspect and manually flush offline queue (IndexedDB + SW background sync).
- RealtimeConnectionPanel.tsx — Debug panel to visualize WS/SSE status and event subscriptions.

Shared referenced utilities
- src/app/middleware.ts — Route guards for /portal and /admin; tenant header forwarding.
- src/lib/auth.ts — NextAuth credentials adapter, JWT session with role + sessionVersion.
- src/lib/permissions.ts — Role/permission mappings (portal relies primarily on user auth + owner checks).
- src/lib/tenant.ts — Tenant extraction and filters (x-tenant-id header/subdomain).
- src/hooks/useBookings.ts — SWR-based listing of SRs/Bookings with portal/admin scope switch.
- src/hooks/useBookingsSocket.ts, src/hooks/useRealtime.ts, src/hooks/useClientNotifications.ts — Realtime hooks for events and notifications.

3. Component Architecture Details

Portal pages
- Dashboard (page.tsx):
  - State: bookings[], loading, filter, deletingId.
  - Interactions: cancel appointment (DELETE /api/bookings/:id), CSV export of fetched bookings.
  - Presentational components: Button, Card, Badge with lucide-react icons.

- ServiceRequestsClient:
  - State: filters (q, status, type tabs, bookingType), pagination (page/limit), date range, debounced search.
  - Hooks: useBookings({ scope: 'portal' }) to fetch data with SWR; EventSource to /api/portal/realtime for auto-refresh; optional useOfflineQueue indicator.
  - Behavior: syncs state to URL via useSearchParams/useRouter, CSV export via API (fallback client CSV).

Reusable portal components
- LiveChatWidget: SSE subscription to /api/portal/realtime (chat-message), GET backlog /api/portal/chat, POST send message; offline-queue of unsent messages in localStorage.
- OfflineQueueInspector: IndexedDB ‘af-offline’ store inspection; triggers SW sync; simple table UI.
- RealtimeConnectionPanel: WS to /api/ws/bookings with selectable event filters; light diagnostic display.

State management & patterns
- Local React state per page/component; no global store (no Redux/Zustand) for Portal module.
- Data fetching via SWR in hooks (stale-while-revalidate, mutate for refresh).
- Optimistic UI used in chat offline flow.

4. Data Flow Architecture

Flow
- UI (pages/components) → Hooks (useBookings, useRealtime/useBookingsSocket) → API routes in src/app/api/portal → Prisma services/models → DB → API response → SWR cache/UI update.

Caching layers
- Client caching via SWR; server-side caching is not used in Portal APIs directly (no Next cache). Availability/pricing leverages shared lib functions which may use Redis elsewhere for admin; not directly in Portal code.

Global state
- None; session via next-auth useSession; local state per component; URL search params for filters.

Custom Hooks
- useBookings(params): builds querystring, picks portal/admin scope, returns items/pagination/isLoading/error/refresh using SWR and apiFetch.
- useRealtime(eventTypes): WS to /api/ws/bookings then fallbacks to SSE /api/portal/realtime; exposes events, connected, helpers.
- useBookingsSocket({ events }): WS-first, fallback SSE; returns { connected, lastEvent, send }.
- useClientNotifications(): subscribes to SSE for event notifications, transforms to user-facing messages, local list management (unread/read).

5. API Architecture

Authentication
- All endpoints in src/app/api/portal/** require an authenticated NextAuth session (getServerSession(authOptions)).

Endpoints
- GET /api/portal/realtime
  - Auth: session required. SSE stream; events filter via ?events=.
  - Payload: SSE ‘data: {type,data,timestamp}’ lines.

- POST /api/portal/chat
  - Body: { message: string } (validated by chatSchema).
  - Rate limit: 10 req/10s per IP. Emits realtime ‘chat-message’ to user’s channel; tenant-aware.
  - Response: { ok: true, message }.
- GET /api/portal/chat?limit=50
  - Returns backlog { messages } (tenant-aware).

- GET /api/portal/service-requests
  - Query: page, limit, status, priority, q, type (all|appointments), bookingType, dateFrom, dateTo.
  - Scope: records where clientId === session.user.id; tenantFilter(tenantId) if multi-tenancy enabled.
  - Response: data[], pagination; legacy fallback when scheduledAt/isBooking absent.

- POST /api/portal/service-requests
  - Body: zod union CreateRequestSchema|CreateBookingSchema. Idempotency via x-idempotency-key. Rate limited (5/min per IP).
  - Validates service existence/active; can plan recurring; emits realtime updates.

- GET /api/portal/service-requests/[id]
  - Scope: must belong to session.user.id; tenant check when enabled; includes service and comments.

- PATCH /api/portal/service-requests/[id]
  - Body: limited updates: { description } or { action: 'cancel'|'approve' } with status guards; rate limited (10/min per IP); emits realtime updates.

- GET/POST /api/portal/service-requests/[id]/comments
  - GET returns comments for client-owned SR.
  - POST zod validates content; creates comment as current user; emits realtime update.

- POST /api/portal/service-requests/[id]/confirm
  - Confirms linked Booking; schedules reminders based on BookingPreferences; sends confirmation email; emits realtime.

- POST /api/portal/service-requests/[id]/reschedule
  - Body: { scheduledAt: ISOString } (zod). Checks booking exists and conflict detection; emits availability + SR update events; audit.

- GET /api/portal/service-requests/availability
  - Query: serviceId, dateFrom, dateTo, duration?, teamMemberId?, includePrice?, currency?.
  - Uses shared availability logic; optional price breakdown per slot.

- GET /api/portal/service-requests/export
  - CSV export of client-owned SRs with filters; rate limited (3/min per IP).

- GET/PUT /api/portal/settings/booking-preferences
  - GET returns DB prefs or defaults. PUT upserts user’s preferences; zod-validated; audit-safe logging.

Error handling & validation
- Consistent zod schemas for inputs and robust 4xx responses; respond.* helpers unify status/payload.
- Graceful dev fallbacks when DB unavailable (P20xx) using lib/dev-fallbacks.

6. Security & Middleware

Route protection
- middleware.ts: redirects unauthenticated users accessing /portal to /login. Prevents caching of /portal.
- Tenant header forwarding (x-tenant-id) when MULTI_TENANCY_ENABLED=true; APIs then apply tenantFilter.

API auth guards
- All portal APIs call getServerSession(authOptions), rejecting when no session.
- Data access is scoped to session.user.id for SRs and comments; detail endpoints also verify ownership and tenantId match.

RBAC/ABAC
- Portal relies on owner-based access (clientId) rather than role permissions; ADMIN/STAFF routes are in /api/admin and guarded differently.

Rate limiting
- Critical mutating endpoints (create SR, comments, chat, export) use rateLimit(getClientIp) to mitigate abuse.

Known gaps
- useClientNotifications connects to /api/admin/realtime; although auth-required, name implies admin-only. Consider a portal-specific notifications stream for clarity and least surprise.
- Admin SSE route does not restrict by role; acceptable if used as generic SSE hub, but naming should reflect shared usage or enforce role where intended.

7. Integration Points

- Admin ↔ Portal: Shared realtime service (/api/ws/bookings, SSE hubs), availability/pricing libs, and shared UI primitives. Portal consumes Services list via internal admin services route fallback when Prisma fails.
- Bookings: Portal POST SR with isBooking=true creates linked Booking; confirm/reschedule endpoints manipulate Booking and trigger reminders/emails.
- Service Requests: Core entity for both; Admin manages all SRs, Portal interacts with own SRs.
- Tasks: Indirect integration via notifications/events and shared libs; no direct Portal task UI surfaced in current pages.

8. Known Issues & Improvements (Audit Findings)

- Inconsistent SSE endpoint usage: useClientNotifications uses /api/admin/realtime from Portal. Rename to /api/portal/realtime or expose a shared /api/realtime to reduce confusion.
- Dashboard bookings cancellation calls /api/bookings/:id; ensure that API enforces ownership (clientId) and tenant scoping (reviewed elsewhere).
- Naming consistency: Service Requests vs Appointments/Bookings filters are mixed; ensure UI labels and backend filters align.
- Dev fallbacks: lib/dev-fallbacks are helpful locally; ensure they are disabled or guarded in production environments.
- Limited e2e coverage for realtime and offline flows; recommend Playwright tests with mocked SSE/WS and service worker.

9. Recommendations

Structure & reuse
- Create a portal-specific realtime notifications hook backed by /api/portal/realtime and migrate useClientNotifications to it.
- Introduce a shared UI module for list filters and CSV export to avoid duplication between admin and portal.
- Consolidate availability and pricing integrations behind a single adapter with clear error surfaces for both modules.

API & schemas
- Add OpenAPI docs or TypeScript zod schemas exported for client consumption (typesafe client factories).
- Add explicit 405 handling for unsupported methods in route handlers.
- Add server-side pagination maximums (already capped) and consider cursor pagination for large lists.

Security hardening
- Consider renaming /api/admin/realtime to /api/realtime or duplicating under /api/portal/realtime to avoid cross-module coupling.
- Ensure /api/bookings/:id DELETE validates ownership (clientId) and tenantId; add tests if missing.
- Expand rate limits for chat based on auth userId in addition to IP (mobile networks share IPs).

Testing
- Unit tests: zod validators, owner/tenant checks, rate limiting behavior, availability boundaries.
- Integration tests: authenticated flows for creating SR/booking, comments, confirm/reschedule; SSE subscription smoke tests.
- E2E (Playwright): filters, pagination, CSV export, offline queue (service worker), chat send/receive.

Operational
- Observability: ensure realtime errors are captured (lib/observability) and include route tags; add logs for SSE connection counts.
- Performance: debounce client CSV generation for large datasets; consider server-side streaming CSV if needed.

Appendix: Key Dependencies
- next-auth, @prisma/client/prisma, zod, swr, lucide-react, sonner, date-fns, internal libs under @/lib (availability, pricing, conflict-detection, realtime-enhanced).
