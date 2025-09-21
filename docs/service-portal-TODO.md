# Service Portal TODO

What was completed ✅
- Availability, pricing, recurrence, BookingWizard, offline cache, Prisma models, realtime (SSE+WS), admin availability, emergency flow, payments (Stripe/COD), reminders, Netlify cron, SW caching/queueing, and initial tests.
- Idempotency for portal submissions (DB model + API guard + SW header propagation) and SWR headers for service details.
- Queue inspector UI and realtime connection panel in /portal/settings.
- Exponential backoff for offline queue with nextAttemptAt scheduling and tests.

Why these were completed
- Improve resiliency, prevent duplicates, provide visibility and robust offline behavior.

Outstanding work (actionable, prioritized)
1) Payment status reflection
- Link payment sessions to ServiceRequest/Booking
- Persist paid/unpaid and retries; expose in admin UI
- Reconcile via webhook idempotency; nightly audit job

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
- Week 1: Payment status reflection plumbing + admin exposure
- Week 2: Capacity enforcement; start promo CRUD scaffolding

Notes
- Key files: public/sw.js, src/lib/offline/backoff.ts, src/app/api/portal/service-requests/route.ts, src/components/portal/*
