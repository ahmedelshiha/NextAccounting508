Summary:
- Added server WebSocket endpoint: /api/ws/bookings (src/app/api/ws/bookings/route.ts). Uses Next runtime WebSocketPair to upgrade and bridges realtimeService events to clients.
- Implemented client hook with WebSocket first and SSE fallback: src/hooks/useBookingsSocket.ts.
- Updated existing useRealtime hook to try WebSocket endpoint and fallback to SSE for compatibility.

Why:
- Provides lower-latency, bidirectional realtime updates (availability changes, assignments, booking events) while preserving existing SSE support.

Files changed/added:
- src/app/api/ws/bookings/route.ts (NEW)
- src/hooks/useBookingsSocket.ts (NEW)
- src/hooks/useRealtime.ts (UPDATED) — now attempts WebSocket before SSE
- docs/service-portal-TODO.md (UPDATED)

Next steps:
- Optionally add authentication/permissions for WS connections (token or session support).
- Add client-side subscription management UI where appropriate.

Logged by: Autonomous Dev (assistant)

---

Update:
- Implemented AvailabilitySlot admin endpoints and minimal admin UI.
- Enhanced emergency booking flow: added UI emergency details field in BookingWizard, server-side validation in portal service-requests POST, and auto-URGENT priority for emergency bookings.

Why:
- Enables operations to manage manual blackouts/capacity immediately.
- Ensures emergency bookings provide actionable details and contact, aligning pricing and validation with business rules.

Files changed/added:
- src/app/api/admin/availability-slots/route.ts (EXISTS) — verified CRUD works
- src/app/admin/availability/page.tsx (EXISTS) — wires manager
- src/components/admin/AvailabilitySlotsManager.tsx (EXISTS) — lists, creates, deletes
- src/components/booking/BookingWizard.tsx (UPDATED) — emergency details field; submit via portal endpoint; offline payload enriched
- src/app/api/portal/service-requests/route.ts (UPDATED) — emergency validations; priority bump
- docs/service-portal-TODO.md (UPDATED) — marked tasks complete; reordered next steps

Next steps:
- Implement Stripe payment intents + webhook handler and update PaymentStep to collect payment details.

---

Update:
- Added Stripe payments (Checkout) integration: new checkout endpoint and webhook; PaymentStep now includes a Pay now redirect.

Why:
- Enables immediate payment capture during booking flow with minimal PCI scope via Stripe-hosted checkout.

Files changed/added:
- src/lib/payments/stripe.ts (NEW)
- src/app/api/payments/checkout/route.ts (NEW)
- src/app/api/payments/webhook/route.ts (NEW)
- src/components/booking/steps/PaymentStep.tsx (UPDATED)
- docs/service-portal-TODO.md (UPDATED)

Next steps:
- Link payment sessions to created ServiceRequests and persist payment status (separate TODO).

---

Update:
- Added Admin Reminders page to review pending reminders and trigger a run.

Files changed/added:
- src/app/api/admin/reminders/run/route.ts (NEW)
- src/components/admin/RunRemindersButton.tsx (NEW)
- src/app/admin/reminders/page.tsx (NEW)
- docs/service-portal-TODO.md (UPDATED)

---

Update:
- Added Cash on delivery (COD) payment option.

Files changed/added:
- src/components/booking/steps/PaymentStep.tsx (UPDATED) — payment method selector and COD messaging
- src/components/booking/BookingWizard.tsx (UPDATED) — wires method and persists in requirements.payment
- src/app/api/payments/cod/route.ts (NEW)
- docs/service-portal-TODO.md (UPDATED)

---

Update:
- Added Netlify Scheduled Function to dispatch booking reminders every 15 minutes and reorganized TODO into actionable plan.

Why:
- Ensures reminder windows (24h/2h) are never missed; decouples scheduling from external cron. Clear plan enables continuous autonomous delivery.

Files changed/added:
- netlify/functions/cron-reminders.ts (NEW)
- docs/service-portal-TODO.md (UPDATED)

Next steps:
- Offline/PWA hardening (SW caching + background sync) and begin unit tests for availability/pricing.

Logged by: Autonomous Dev (assistant)

---

Update:
- Hardened PWA offline support and added initial unit tests.

Why:
- Improve resilience offline: cache services APIs, queue portal service-requests when offline (Background Sync), and fix cache versioning.

Files changed/added:
- public/sw.js (UPDATED) — single CACHE_NAME (booking-system-v3), stale-while-revalidate for /api/services*, enqueue + 202 for POST /api/portal/service-requests and /api/bookings; Background Sync tag service-requests-sync.
- src/components/providers/client-layout.tsx (UPDATED) — registers Background Sync after SW ready; processes queue on online.
- tests/booking-availability.test.ts (NEW)
- tests/pricing-calculation.test.ts (NEW, prisma mocked)
- docs/service-portal-TODO.md (UPDATED)

Next steps:
- Expand tests coverage for recurrence and API routes; add idempotency keys to queued submissions.

Logged by: Autonomous Dev (assistant)

---

Update:
- Fixed missing import in recurring planner; added unit tests for recurrence and an integration test for recurring preview API.

Why:
- Ensures recurrence planning compiles and behaves deterministically in tests without DB.

Files changed/added:
- src/lib/booking/recurring.ts (UPDATED) — import checkBookingConflict
- tests/recurrence-planner.test.ts (NEW)
- tests/api-recurring-preview.test.ts (NEW)
- docs/service-portal-TODO.md (UPDATED)

Next steps:
- Optionally run full test suite in CI; consider adding idempotency keys and more API failure-path tests.

Logged by: Autonomous Dev (assistant)
