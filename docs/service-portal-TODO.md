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
1. Emergency booking flow (UI + server-side validation + pricing surcharge) — required to support higher-priority booking types and special validation rules.
2. Payment gateway integration (Stripe or other) — PaymentStep currently only requests a price quote; no capture/intent/webhook flow exists.
3. Admin UI & API for AvailabilitySlot management (create/update/delete blackout dates, capacity overrides, reasons) — availabilitySlots model exists but admin management is not complete.
4. Daily/team capacity enforcement improvements — conflict detection should include per-team/day capacity limits and clearer failure messages for UI consumption.
5. Scheduled reminders persistence & dispatch (cron job) — ScheduledReminder model exists; cron job and dispatch logic to send emails/SMS needs implementation/integration with sendgrid or SMS provider.
6. Auto-assign and assignment rules (teamMember autoAssign) — auto-assign flow should be wired from portal and booking endpoints.
7. Payment status reflection on Booking/ServiceRequest — mark paid/unpaid and handle failures/retries.
8. Offline queue resilience & Service caching — SW integration and replay for cached /api/bookings and /api/services, stress test offline flows.
9. Unit & integration tests for availability, pricing, recurring plan, and booking APIs.
10. WebSocket endpoint for bookings (WS) and robust client-subscription handling — SSE fallback exists, but WS endpoint is still desirable.
11. Promo system extensibility and promo resolver hooks — support per-service promo rules and admin CRUD for promo codes.
12. ICS export improvements and timezone-normalized calendar invites.

Next steps (short-term) — recommended order
- Implement AvailabilitySlot admin endpoints and minimal admin UI (owner: Platform Team, ETA: 3 days). Reason: Allows ops to manage blackouts and capacity immediately.
- Add emergency booking flow (UI + API validation + pricing flag) (owner: Booking UX, ETA: 2 days). Reason: Enables urgent bookings and test of surcharge logic.
- Implement Stripe payment intents + webhook handler + update PaymentStep to collect payment details (owner: Payments, ETA: 4 days). Reason: Required to accept payments and mark bookings as paid.
- Implement ScheduledReminder dispatch cron job and a simple admin UI to review pending reminders (owner: Platform Team, ETA: 3 days). Reason: Ensures clients receive reminders per preferences.
- Harden offline queue and add simple SW caching for services and replay logic (owner: Offline/PWA, ETA: 4 days).
- Add unit tests for availability and pricing (owner: QA/Dev, ETA: 3 days).

Notes & references
- Relevant files reviewed: src/components/booking/BookingWizard.tsx, src/components/booking/steps/*, src/lib/booking/*, src/lib/offline/booking-cache.ts, prisma/schema.prisma, src/app/booking/page.tsx
- See docs/booking_enhancement_plan.md for mapped requirements and migration details.

Completed now ✅
- Audit of booking module completed and docs/service-portal-TODO.md updated to reflect findings and prioritized next steps.

If you want I can proceed to implement the top priority: AvailabilitySlot admin endpoints (API + minimal admin UI). Reply with which item to start next.
