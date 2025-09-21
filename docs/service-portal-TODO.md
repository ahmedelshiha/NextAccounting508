# Service Portal TODO

This document was updated after a code audit of the booking module against docs/booking_enhancement_plan.md.

Summary of audit
- Reviewed docs/booking_enhancement_plan.md and compared to the current implementation in src/components/booking, src/lib/booking, and prisma schema.
- Many core features from the plan are implemented, but important enhancements and operational pieces remain.

What was completed ✅
- Core availability engine implemented (src/lib/booking/availability.ts) — generates slots, applies business hours, buffers, member working hours, and capacity.
- Team-member-aware availability implemented (respects TeamMember.workingHours, bookingBuffer, maxConcurrentBookings) and falls back to Service.businessHours.
- Pricing engine implemented (src/lib/booking/pricing.ts) with surcharges, overage, weekend and peak handling, currency conversion support.
- Recurrence preview and planning implemented (src/lib/booking/recurring.ts).
- BookingWizard UI (multi-step) implemented with service selection, team selection, date/time, recurrence, pricing quote step, client info and confirmation (src/components/booking/BookingWizard.tsx).
- Offline booking cache exists (src/lib/offline/booking-cache.ts) and pending bookings flush logic integrated into the wizard (saved to IndexedDB). Fixed transaction completion handling.
- Prisma schema includes Booking, ServiceRequest, AvailabilitySlot, BookingPreferences and ScheduledReminder models (prisma/schema.prisma) matching plan fields.
- SSE realtime updates for availability implemented in wizard (EventSource to /api/portal/realtime).

Why these were completed
- They form the core booking experience (availability, pricing, recurrence, UI flow) required by the ServiceMarket-style booking flow described in the plan. Having them implemented enables the rest of the operational and edge-case features to be layered on top.

Missing features / Improvements (TODO list)
1. Payment gateway integration (Stripe Checkout + Webhook) — Implemented: checkout session creation endpoint, webhook, and Pay now button in PaymentStep.
2. Daily/team capacity enforcement improvements — conflict detection should include per-team/day capacity limits and clearer failure messages for UI consumption.
3. Scheduled reminders persistence & dispatch (cron job) — ScheduledReminder model exists; cron job and dispatch logic to send emails/SMS needs implementation/integration with sendgrid or SMS provider.
4. Auto-assign and assignment rules (teamMember autoAssign) — auto-assign flow should be wired from portal and booking endpoints.
5. Payment status reflection on Booking/ServiceRequest — mark paid/unpaid and handle failures/retries.
6. Offline queue resilience & Service caching — SW integration and replay for cached /api/bookings and /api/services, stress test offline flows.
7. Unit & integration tests for availability, pricing, recurring plan, and booking APIs.
8. WebSocket auth/permissions for bookings WS and client subscription management UI.
9. Promo system extensibility and promo resolver hooks — support per-service promo rules and admin CRUD for promo codes.
10. ICS export improvements and timezone-normalized calendar invites.

Next steps (short-term) — recommended order
- Implement ScheduledReminder dispatch cron job and a simple admin UI to review pending reminders (owner: Platform Team, ETA: 3 days). Reason: Ensures clients receive reminders per preferences.
- Harden offline queue and add simple SW caching for services and replay logic (owner: Offline/PWA, ETA: 4 days).
- Add unit tests for availability and pricing (owner: QA/Dev, ETA: 3 days).
- Add WebSocket auth/permissions and subscription management UI (owner: Platform Team, ETA: 2 days).
- Enhance daily/team capacity enforcement (owner: Platform Team, ETA: 2 days).

Notes & references
- Relevant files reviewed: src/components/booking/BookingWizard.tsx, src/components/booking/steps/*, src/lib/booking/*, src/lib/offline/booking-cache.ts, prisma/schema.prisma, src/app/booking/page.tsx
- See docs/booking_enhancement_plan.md for mapped requirements and migration details.

Completed now ✅
- Audit of booking module completed and docs/service-portal-TODO.md updated to reflect findings and prioritized next steps.
- AvailabilitySlot admin endpoints and minimal admin UI implemented: /api/admin/availability-slots (CRUD), Admin page (src/app/admin/availability/page.tsx), and manager component (src/components/admin/AvailabilitySlotsManager.tsx).
- Emergency booking flow enhanced: UI requires emergency details; server-side validation for emergency bookings (phone and details), auto-priority set to URGENT, and pricing flag integrated.
- Payments: Added Stripe Checkout session endpoint (/api/payments/checkout), webhook handler (/api/payments/webhook), and Pay now action in PaymentStep.
- Reminders: Admin review page (src/app/admin/reminders/page.tsx) to list pending reminders and a Run now action via /api/admin/reminders/run.

Next up: harden offline queue and SW caching; add tests; WS auth; capacity enforcement.
