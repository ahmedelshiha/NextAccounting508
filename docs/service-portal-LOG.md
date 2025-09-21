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
