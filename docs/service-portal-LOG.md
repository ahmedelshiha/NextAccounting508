## 2025-09-21 — Offline booking queue + Background Sync (Phase 1)

Summary
- Implemented a client-side IndexedDB queue for portal service request submissions when offline.
- Added service worker Background Sync to flush the queue when connectivity is restored.
- Updated portal New Service Request page to detect offline state, enqueue payloads, and notify the user.

Why
- Enables robust submissions in unreliable network conditions and improves UX for mobile clients.

Files Changed
- public/sw.js (add Background Sync queue processing)
- src/lib/offline-queue.ts (new: IndexedDB queue + helpers)
- src/app/portal/service-requests/new/page.tsx (enqueue + sync registration + recovery)

Next Steps
- Add UI indicator for pending queued items and submission history in portal list view.
- Gate PWA features behind NEXT_PUBLIC_ENABLE_PWA and add simple telemetry for cache hits.
- Optional: Add retry backoff and cap to queue processing; handle attachment re-uploads.

---

## 2025-09-21 — Legacy /api/bookings POST conflict passthrough & tests

Summary
- Mapped legacy /api/bookings POST payloads to the unified booking shape (isBooking, scheduledAt, duration, client details) so downstream conflict detection triggers.
- Added tests to ensure 409 with error.code=CONFLICT is surfaced for both admin and portal flows through the legacy endpoint.

Why
- Ensures backward-compatible clients using /api/bookings receive correct conflict semantics without migrating immediately.
- Aligns with deprecation plan while preserving correctness and observability.

Files Changed
- src/app/api/bookings/route.ts (mapping improvements: isBooking normalization, team member assignment for admin)
- tests/bookings.post-conflict-409.test.ts (new)

Next Steps
- Proceed with remaining P0 (schema deploy) and P1 route/unit tests for availability and reschedule conflict paths.

---

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

---

## 2025-09-21 — Uploads & Antivirus integration tests

Summary
- Added uploads API tests for clean and infected (lenient policy) flows using Netlify Blobs mock.
- Added AV callback quarantine test and admin quarantine list/action tests.

Why
- Validates end-to-end behavior for AV scanning, quarantine, and admin operations without external dependencies.

Files Changed
- tests/uploads.clean.test.ts (new)
- tests/uploads.infected.lenient.test.ts (new)
- tests/admin-quarantine.route.test.ts (new)

Next Steps
- Configure envs on deploy (UPLOADS_PROVIDER=netlify, NETLIFY_BLOBS_TOKEN, UPLOADS_AV_SCAN_URL, UPLOADS_AV_POLICY, optional UPLOADS_AV_CALLBACK_SECRET).
