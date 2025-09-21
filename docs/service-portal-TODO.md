# 2025-09-21 — Booking Module Audit (vs docs/booking_enhancement_plan.md)

This section captures concrete gaps found during audit and the actionable work to align implementation with the plan.

## Gaps & Action Items

1) Availability API
- [ ] Refactor /api/bookings/availability to use lib/booking/getAvailabilityForService
- [ ] Support teamMemberId param and filter
- [ ] Honor service config: businessHours, bufferTime, blackoutDates, maxDailyBookings
- [ ] Preserve includePrice/promo and currency conversion
- [ ] Add unit tests (buffers, weekends, caps) and route tests for includePrice/promo

2) Booking Wizard UX
- [ ] Split current monolithic wizard into step components
- [ ] Add Team Member selection; filter availability accordingly
- [ ] Add Recurrence step (frequency/interval/until); integrate preview endpoints and series creation
- [ ] Add optional Payment step; surface PricingEngine breakdown and promo application
- [ ] Subscribe to realtime availability-updated events to auto-refresh slots

3) Server Integration & Conflicts
- [ ] Ensure POST /api/bookings (proxy) returns 409 on conflicts consistently via admin/portal service-requests integration
- [ ] Add route tests for create/reschedule 409 scenarios

4) Client Preferences & Reminders
- [ ] Expose BookingPreferences UI (reminder windows, timezone, channels)
- [ ] Pass timezone/locale to confirmation and reminder emails; verify ICS uses client preferences

5) PWA & Offline
- [ ] Implement offline booking cache (IndexedDB) + background sync for pending bookings
- [ ] Expand SW caching for /api/services and availability responses; keep flag-gated (NEXT_PUBLIC_ENABLE_PWA)

6) Navigation & i18n
- [ ] Consider adding a top-nav “Booking” entry (CTA exists in Hero). Keep current styles and responsiveness
- [ ] Localize wizard labels/messages using existing locales in src/app/locales

7) QA & E2E
- [ ] Unit tests for availability/pricing libraries
- [ ] Route tests for availability includePrice & promo handling
- [ ] E2E happy path: wizard → create → confirm → email with ICS

---

Below is the existing program checklist for broader context.

