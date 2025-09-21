# Service Portal TODO

Updated: 2025-09-21

What was completed ✅
- Availability, pricing, recurrence, BookingWizard, offline cache, Prisma models, realtime (SSE+WS), admin availability, emergency flow, payments (Stripe/COD), reminders, Netlify cron, SW caching/queueing, and initial tests.
- Idempotency for portal submissions (DB model + API guard + SW header propagation) and SWR headers for service details.
- Queue inspector UI and realtime connection panel in /portal/settings.
- Exponential backoff for offline queue with nextAttemptAt scheduling and tests.
- Stripe checkout now bound to a specific ServiceRequest (pre-create on CARD checkout) and webhook updated to reconcile by serviceRequestId.

Why these were completed
- Improve resiliency, prevent duplicates, provide visibility and robust offline behavior.
- Ensure payment sessions map deterministically to bookings for accurate status reflection and reconciliation.

In progress 🔄
- Payment status reflection plumbing: admin UI exposure and reconciliation job.

Outstanding work (ordered, actionable)

1) Payments — status visibility & reconciliation
- [x] Expose paymentStatus/paymentSessionId/paymentAmount in Admin service-requests table (badges)
- [x] Add paymentStatus filter in Admin filters; plumbed through API and hook
- [ ] Expose payment fields in Admin service-request detail view
- [ ] Implement nightly reconciliation job to fix mismatches and stale sessions (uses webhook idempotency and Stripe session lookup)
- [ ] Tests: webhook success/fail, reconciliation, and UI badges

2) Capacity enforcement improvements
- [ ] Per-team/day capacity limits and API error codes
- [ ] Admin override with audit trail
- [ ] Tests for capacity edge cases

3) Promo system extensibility
- [ ] Admin CRUD for promo rules
- [ ] Integrate rules into pricing resolver (keep existing codes)
- [ ] Tests for rule priority and stacking

4) ICS export improvements
- [ ] TZ-normalized invites
- [ ] Include metadata and cancellation link
- [ ] Tests for timezone correctness

5) Team member selection (portal-safe)
- [ ] Add read-only portal endpoint to list available team members per service
- [ ] Update TeamMemberSelection to fallback to portal endpoint on 401
- [ ] Tests for fallback path

6) Realtime & Recurring tests
- [ ] SSE availability updates on create/reschedule
- [ ] Conflict 409 path coverage
- [ ] Recurring preview conflict cases

7) BookingWizard polish
- [ ] Include Confirmation step in progress indicator and align labels

Next steps (2-week plan)
- Week 1: Finish payments status visibility + reconciliation job
- Week 2: Capacity enforcement; start promo CRUD scaffolding

Notes
- Key files: public/sw.js, src/lib/offline/backoff.ts, src/app/api/portal/service-requests/route.ts, src/app/api/payments/*, prisma/schema.prisma, src/components/portal/*
