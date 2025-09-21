# Service Portal TODO

This document reflects the current state of the Service Portal after audits and recent enhancements.

What was completed ✅
- Core availability engine implemented (src/lib/booking/availability.ts) — slot generation, business hours, buffers, member working hours, capacity.
- Team-member-aware availability implemented with fallbacks to Service.businessHours.
- Pricing engine implemented (src/lib/booking/pricing.ts) with surcharges, overage, weekend/peak handling, currency conversion.
- Recurrence preview and planning (src/lib/booking/recurring.ts).
- BookingWizard UI (src/components/booking/BookingWizard.tsx) — service selection, team selection, date/time, recurrence, pricing, client info, confirmation.
- Offline booking cache (src/lib/offline/booking-cache.ts) with pending flush in wizard.
- Prisma schema covers Booking, ServiceRequest, AvailabilitySlot, BookingPreferences, ScheduledReminder (prisma/schema.prisma).
- Realtime updates for availability via SSE (EventSource /api/portal/realtime) and optional WS (src/hooks/useBookingsSocket.ts).
- AvailabilitySlot admin endpoints + UI (src/app/api/admin/availability-slots, src/app/admin/availability/page.tsx, src/components/admin/AvailabilitySlotsManager.tsx).
- Emergency booking flow: UI requires details; server validation for emergency (phone/details), auto-priority URGENT.
- Payments: Stripe Checkout endpoint (/api/payments/checkout), webhook (/api/payments/webhook), Pay now in PaymentStep, Cash on delivery (COD) option.
- Reminders: Admin review (src/app/admin/reminders/page.tsx) and Run now trigger (/api/admin/reminders/run).
- Netlify scheduled reminders: cron dispatcher every 15 minutes (netlify/functions/cron-reminders.ts) calling /api/cron/reminders with secret.
- PWA offline hardening: public/sw.js upgraded (single cache version booking-system-v3), S-W-R for /api/services*, enqueue + 202 for POST /api/portal/service-requests and /api/bookings; client registers Background Sync and flushes queue on online.
- Initial unit tests added for availability and pricing (tests/booking-availability.test.ts, tests/pricing-calculation.test.ts).

Why these were completed
- They enable the production booking experience (availability, pricing, recurrence, payments) and add operational controls (admin availability, emergency flow, reminders). Offline/PWA and tests improve resiliency and confidence.

Outstanding work (actionable, prioritized)

1) Offline/PWA follow-ups
- Add idempotency keys (e.g., x-idempotency-key) to queued submissions to prevent duplicates server-side
- Add retry/backoff metadata persisted in queue; expose basic queue inspector in portal settings
- Cache service-details requests (/api/services/[slug]) and critical portal pages with S-W-R hints

2) Tests: expand coverage
- Unit tests for recurrence planner
- Integration tests for /api/portal/service-requests and /api/bookings (happy paths + failures)
- Edge cases: buffers, capacity overflow messaging, promo resolver constraints

3) WebSocket auth and subscription management
- Token/session-authenticated connection to /api/ws/bookings
- Per-user/tenant subscription scopes
- Simple UI to show connection state and manage channels

4) Capacity enforcement improvements
- Extend conflict detection for per-team/day capacity limits
- Deterministic error codes/messages for UI consumption
- Add admin override flag with audit trail

5) Payment status reflection
- Link payment sessions to ServiceRequest/Booking records
- Persist paid/unpaid, record failures/retries, and expose in admin UI
- Reconcile via webhook idempotency keys; nightly audit of unresolved payments

6) Promo system extensibility
- Per-service promo rules (percentage/fixed, date windows, constraints)
- Admin CRUD for promo codes (API + UI)
- Hook into pricing engine via resolver interface

7) ICS export improvements
- Timezone-normalized calendar invites
- Include service/location metadata and cancellation link

Next steps (2-week plan)
- Week 1:
  - Tests expansion for recurrence and APIs (item 2)
- Week 2:
  - WS auth + subscription UI (item 3)
  - Capacity enforcement (item 4)

Notes & references
- Reviewed: src/components/booking/BookingWizard.tsx, src/components/booking/steps/*, src/lib/booking/*, src/lib/offline/booking-cache.ts, prisma/schema.prisma, src/app/booking/page.tsx
- Plans: docs/booking_enhancement_plan.md
- Cron: src/app/api/cron/reminders/route.ts, netlify/functions/cron-reminders.ts, src/app/admin/cron-telemetry/page.tsx

Completed now ✅
- Upgraded service worker for resilient offline behavior; added Background Sync integration and expanded API caching. Added initial unit tests covering availability and pricing.

Next up
- Expand test coverage (recurrence + API routes) and begin WS auth work.
