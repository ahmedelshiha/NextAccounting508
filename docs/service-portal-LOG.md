## 2025-09-21 — Availability pricing includePrice + promo tests

Summary
- Added route tests for /api/bookings/availability to validate includePrice with currency and promo codes.
- Covered base price, WELCOME10 (-10%), SAVE15 (-15%) and currency override propagation.

Why
- Ensures clients receive accurate pricing annotations with slots and that promo codes are respected.

Files Changed
- tests/bookings-availability.pricing.test.ts (new)

Next Steps
- Add admin/portal availability pricing tests if needed; proceed with P1 uploads & AV configuration.
