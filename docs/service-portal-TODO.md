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
- Realtime updates for availability via SSE (EventSource /api/portal/realtime) and WebSocket endpoint (src/app/api/ws/bookings/route.ts) with client hook (src/hooks/useBookingsSocket.ts).
- AvailabilitySlot admin endpoints + UI (src/app/api/admin/availability-slots, src/app/admin/availability/page.tsx, src/components/admin/AvailabilitySlotsManager.tsx).
- Emergency booking flow: UI requires details; server validation for emergency (phone/details), auto-priority URGENT.
- Payments: Stripe Checkout endpoint (/api/payments/checkout), webhook (/api/payments/webhook), Pay now in PaymentStep, Cash on delivery (COD) option.
- Reminders: Admin review (src/app/admin/reminders/page.tsx) and Run now trigger (/api/admin/reminders/run).
- Netlify scheduled reminders: cron dispatcher every 15 minutes (netlify/functions/cron-reminders.ts) calling /api/cron/reminders with secret.
- PWA offline hardening: public/sw.js upgraded (single cache version booking-system-v3), S-W-R for /api/services*, enqueue + 202 for POST /api/portal/service-requests and /api/bookings; client registers Background Sync and flushes queue on online.
- Initial unit tests added for availability, pricing and recurrence, plus recurring preview API (tests/*.test.ts).

Newly completed in this iteration ✅
- Idempotency keys end-to-end for queued submissions: added Prisma model IdempotencyKey, server-side guard in POST /api/portal/service-requests and SW propagation via x-idempotency-key header.
- Queue inspector UI in portal settings to view and retry offline submissions (src/components/portal/OfflineQueueInspector.tsx) wired into /portal/settings.
- WebSocket endpoint now supports session/JWT-based identification (best-effort) and respects events query param; simple subscription management panel added to settings (src/components/portal/RealtimeConnectionPanel.tsx).
- Added Cache-Control SWR headers to /api/services/[slug] to improve client caching.

Why these were completed
- Prevent duplicate creations from offline retries, provide transparency/control over the offline queue, enable per-user scoping for realtime updates, and improve perceived performance for service details.

Outstanding work (actionable, prioritized)
1) Offline/PWA follow-ups
- Add exponential backoff and nextAttemptAt scheduling in SW queue; cap retries and expose retry reason in inspector
- Extend SW to include idempotency for /api/bookings legacy path if used anywhere else

2) Payment status reflection
- Link payment sessions to ServiceRequest/Booking records
- Persist paid/unpaid, record failures/retries, and expose in admin UI
- Reconcile via webhook idempotency keys; nightly audit of unresolved payments

3) Capacity enforcement improvements
- Extend conflict detection for per-team/day capacity limits
- Deterministic error codes/messages for UI consumption
- Add admin override flag with audit trail

4) Promo system extensibility
- Per-service promo rules (percentage/fixed, date windows, constraints)
- Admin CRUD for promo codes (API + UI)
- Hook into pricing engine via resolver interface

5) ICS export improvements
- Timezone-normalized calendar invites
- Include service/location metadata and cancellation link

6) Tests: expand coverage
- Idempotency behavior (duplicate POST returns same entity)
- WebSocket auth channel scoping and UI interactions
- API failure paths for offline flush and payment reconciliation

Next steps (2-week plan)
- Week 1:
  - Implement SW exponential backoff + tests (item 1)
  - Start payment status reflection plumbing (item 2)
- Week 2:
  - Capacity enforcement changes (item 3)
  - Begin promo CRUD scaffolding (item 4)

Notes & references
- Reviewed: src/components/booking/BookingWizard.tsx, src/components/booking/steps/*, src/lib/booking/*, src/lib/offline/booking-cache.ts, prisma/schema.prisma, src/app/booking/page.tsx
- Cron: src/app/api/cron/reminders/route.ts, netlify/functions/cron-reminders.ts, src/app/admin/cron-telemetry/page.tsx
