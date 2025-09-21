## 2025-09-21 — Availability API Refactor

Summary
- Refactored /api/bookings/availability to use lib/booking/getAvailabilityForService.
- Injected service configuration (businessHours, bufferTime, maxDailyBookings) and filtered blackoutDates.
- Added support for teamMemberId parameter.
- Preserved includePrice, currency, and promoCode behavior via PricingEngine.

Why
- Centralizes availability logic to reduce duplication and ensure consistency across admin/portal/public.
- Respects admin-configured business hours and capacity limits.
- Enables per–team member calendars.

Files Changed
- src/app/api/bookings/availability/route.ts (refactor)
- docs/service-portal-TODO.md (mark item complete, add summary)

Next Steps
- Add unit tests for availability options (buffers, weekends via businessHours, caps) and route tests for includePrice/promo.
- Wire BookingWizard realtime refresh and team member selection (pending).


## 2025-09-21 — Booking Wizard Recurrence Step

Summary
- Added Recurrence step to BookingWizard with frequency, interval, end-by count/date, and weekly day selection.
- Integrated conflict-aware preview via /api/portal/service-requests/recurring/preview with graceful client-side fallback.
- Enabled recurring series creation by posting isBooking=true, bookingType=RECURRING, and recurringPattern to portal endpoint.

Why
- Supports common client need to schedule recurring appointments while avoiding conflicts before creation.
- Aligns UI with existing backend recurring planning and series creation capabilities.

Files Changed
- src/components/booking/BookingWizard.tsx (integrated step, submission logic)
- src/components/booking/steps/RecurrenceStep.tsx (new reusable component)
- docs/service-portal-TODO.md (mark item complete)

Next Steps
- Add route tests for preview endpoints and series creation flows.
- Extend UI to expose pricing breakdown per occurrence when includePrice is requested.
- Consider admin-configurable defaults for recurrence (e.g., default weekly days).


## 2025-09-21 — Realtime availability auto-refresh

Summary
- BookingWizard now subscribes to portal SSE (availability-updated) and refreshes slots when matching service/date updates occur.

Why
- Keeps availability accurate after create/reschedule/cancel events without manual reload.

Files Changed
- src/components/booking/BookingWizard.tsx (SSE subscription)
- docs/service-portal-TODO.md (mark item complete)


## 2025-09-21 — Payment step & Pricing breakdown

Summary
- Added PaymentStep to BookingWizard with server-calculated pricing breakdown and promo application.
- Introduced /api/pricing POST route using PricingEngine for accurate totals.

Why
- Provides transparent pricing to users and supports promos before submission.

Files Changed
- src/components/booking/steps/PaymentStep.tsx (new)
- src/components/booking/BookingWizard.tsx (integrated Payment step)
- src/app/api/pricing/route.ts (new)
- docs/service-portal-TODO.md (mark item complete)


## 2025-09-21 — Top navigation Booking entry

Summary
- Added a “Booking” link to the main navigation pointing to /booking, consistent with existing styles and responsive behavior.

Why
- Provides quick access to the booking flow from the top navigation, aligning with CTA in the Hero section.

Files Changed
- src/components/ui/navigation.tsx (navigation items)
- docs/service-portal-TODO.md (mark item complete)
