# Service Portal TODO

What was completed ✅
- Availability, pricing, recurrence, BookingWizard, offline cache, Prisma models, realtime (SSE+WS), admin availability, emergency flow, payments (Stripe/COD), reminders, Netlify cron, SW caching/queueing, and initial tests.
- Idempotency for portal submissions (DB model + API guard + SW header propagation) and SWR headers for service details.
- Queue inspector UI and realtime connection panel in /portal/settings.
- Exponential backoff for offline queue with nextAttemptAt scheduling and tests.

Why these were completed
- Improve resiliency, prevent duplicates, provide visibility and robust offline behavior.

In progress 🔄
- Payment status reflection plumbing: schema fields, webhook linking, checkout binding; next add admin UI and reconciliation.

Outstanding work (actionable, prioritized)
1) Payment status reflection
- Expose payment status in admin service-requests table and detail view
- Add nightly reconciliation job using webhook idempotency

2) Capacity enforcement improvements
- Per-team/day capacity limits and error codes
- Admin override with audit trail

3) Promo system extensibility
- Promo rules and admin CRUD; integrate with pricing resolver

4) ICS export improvements
- TZ-normalized invites; include metadata and cancellation link

5) Tests expansion
- Idempotency duplicate POST path, WS auth scoping, payment reconciliation failure paths

Next steps (2-week plan)
- Week 1: Finish payment status reflection + admin exposure
- Week 2: Capacity enforcement; start promo CRUD scaffolding

Notes
- Key files: public/sw.js, src/lib/offline/backoff.ts, src/app/api/portal/service-requests/route.ts, src/app/api/payments/*, prisma/schema.prisma, src/components/portal/*

---

## Booking Module Audit — 2025-09-21

✅ What was completed
- Verified multi-step BookingWizard flow is implemented and functional:
  - Steps: service selection, team member selection (optional), date & time, recurrence (optional), payment (quote + checkout), client details, confirmation.
  - UI: src/components/booking/BookingWizard.tsx with step components RecurrenceStep.tsx, TeamMemberSelection.tsx, PaymentStep.tsx.
- Availability: GET src/app/api/bookings/availability/route.ts supports teamMemberId, currency, promoCode, bookingType, days, and pricing inclusion; backed by src/lib/booking/availability.ts.
- Pricing: POST src/app/api/pricing/route.ts uses src/lib/booking/pricing.ts with weekend/peak/emergency and promo resolver; currency conversion supported.
- Booking creation: POST src/app/api/portal/service-requests/route.ts (and legacy shim at src/app/api/bookings/route.ts) handles single and recurring bookings, emergency validations, conflict detection, and auto-assign.
- Recurring preview: POST src/app/api/portal/service-requests/recurring/preview/route.ts via src/lib/booking/recurring.ts; client UI wired in RecurrenceStep.
- Realtime: Client subscribes to /api/portal/realtime; server emits availability-updated via src/lib/realtime-enhanced.ts on create/reschedule.
- Offline: IndexedDB cache at src/lib/offline/booking-cache.ts with flush to /api/bookings; BookingWizard triggers flush on reconnect.

✅ Why it was done
- Aligns implementation with docs/booking_enhancement_plan.md to ensure robust scheduling, pricing, recurrence, realtime updates, and offline resilience across portal and admin flows.

✅ Next steps
- Bind Stripe checkout to a specific ServiceRequest (high):
  - Pre-create a pending ServiceRequest when user selects CARD in step 5 and pass serviceRequestId to POST /api/payments/checkout (route already supports it); update webhook reconciliation. Files: BookingWizard.tsx, src/app/api/payments/webhook/route.ts (and related payment status updaters).
- Admin payment visibility (high): expose paymentStatus/paymentSessionId in admin tables/detail and add filters/badges. Files: src/app/admin/service-requests/* and components.
- Payments reconciliation job (high): nightly job to reconcile orphaned or stale Stripe sessions using webhook idempotency. Files: netlify/functions/cron-reminders.ts or new cron; src/app/api/payments/webhook/route.ts.
- Tests (medium): add E2E for availability SSE on create/reschedule; conflict 409 path; recurring preview conflicts. Files: tests/*.
- Team member fallback (medium): add a portal-safe endpoint to list available team members per service so non-admin clients can pick a preferred member; update TeamMemberSelection to use it when admin endpoint is unauthorized. Files: src/app/api/portal/team-members/route.ts (new), TeamMemberSelection.tsx.
- Wizard polish (low): include Confirmation step in progress indicator for consistency.
