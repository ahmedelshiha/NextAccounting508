# Service Portal Dev Log

## 2025-09-21
- Reviewed docs/service-portal-TODO.md and booking_enhancement_plan.md.
- Implemented ServiceRequest binding for Stripe checkout:
  - BookingWizard pre-creates ServiceRequest on CARD payment path and passes serviceRequestId to checkout.
  - Payments webhook updated to reconcile directly via serviceRequestId metadata.
- Admin: added paymentStatus badges and amount to service-requests table; added paymentStatus filter wired through useBookings and admin API.
- Updated docs/service-portal-TODO.md with completion, rationale, and next actions.
- Planned follow-on work: admin payment detail view, nightly reconciliation, tests.
