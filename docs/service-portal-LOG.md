

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
