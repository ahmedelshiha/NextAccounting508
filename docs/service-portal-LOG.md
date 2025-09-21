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
