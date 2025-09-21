# Service Portal — Reorganized Action Plan (2025-09-21)

This replaces the previous ad-hoc checklist with a prioritized, dependency-aware plan. Each task is specific, actionable, and measurable.

## P0 — Deployment & Schema (Critical Path)
1. Deploy Phase 1 schema (migrate + seed)
   - Steps: pnpm db:generate → db:migrate → db:seed on CI; verify scheduledAt/isBooking present.
   - Acceptance: /api/db-check passes; admin/portal list queries return without schema fallbacks.
   - Deps: Netlify envs set (DATABASE_URL, NEXTAUTH_*, etc.)

2. Proxy compatibility: /api/bookings POST must surface 409 conflicts
   - Steps: Add tests for POST /api/bookings mapping to admin/portal routes and returning 409 on conflicts.
   - Acceptance: New test passes and manual conflict returns { success: false, error.code: 'CONFLICT' }.
   - Deps: ConflictDetectionService

## P1 — API Correctness & Tests
3. Availability route tests for includePrice/promo
   - Steps: Add route tests validating price currency and promoCode application on sample dates.
   - Acceptance: Tests cover base, promo=WELCOME10, promo=SAVE15; currency conversion branch exercised.
   - Status: Implemented for /api/bookings/availability (tests/bookings-availability.pricing.test.ts).

4. Unit tests: availability engine (buffers, weekends via businessHours, caps)
   - Steps: Add cases for buffer overlap, weekend closed, maxDailyBookings skip.
   - Acceptance: All edge cases green; threshold suite stable.

5. Route tests: create/reschedule 409 (admin and portal)
   - Steps: Ensure both create and reschedule conflict tests exist and cover teamMemberId filter.
   - Acceptance: Tests green and fail when conflict logic is removed.

## P1 — Uploads & Antivirus
6. Configure uploads provider & antivirus
   - Steps: Set UPLOADS_PROVIDER=netlify, NETLIFY_BLOBS_TOKEN, UPLOADS_AV_SCAN_URL, UPLOADS_AV_API_KEY; run smoke upload and verify quarantine UI.
   - Acceptance: Clean file → status clean; EICAR → quarantined with details; CSV export works.

## P1 — Staging Smoke Tests
7. End-to-end smoke on staging
   - Steps: Portal create → admin assign → status transitions → realtime update → CSV export → uploads/AV.
   - Acceptance: No 500s; logs clean; UI reflects updates in real-time.

## P2 — UX, Localization, Preferences
8. BookingPreferences UI (reminders/timezone/channels)
   - Steps: Build settings form; persist; read in cron reminders and ICS generation.
   - Acceptance: Preferences roundtrip; reminders honor windows; ICS uses timezone.

9. Localize wizard labels/messages
   - Steps: Use src/app/locales; add keys for all wizard steps incl. Recurrence and Payment.
   - Acceptance: en/ar/hi strings load; fallback behavior verified.

## P2 — PWA & Offline
10. Offline booking cache + background sync
    - Steps: IndexedDB store for pending bookings; background sync to retry; UI indicator.
    - Acceptance: Offline create queues and syncs successfully on reconnect.

11. Expand SW caching for /api/services and availability
    - Steps: Add runtime cache; respect flag NEXT_PUBLIC_ENABLE_PWA.
    - Acceptance: Cache hit ratio visible in logs; manual validation via devtools.

## P2 — Observability & Ops
12. Sentry and health alerts
    - Steps: Set SENTRY_DSN; add alerting for AV failures, realtime adapter reconnect loops, error rate spikes.
    - Acceptance: Test events arrive in Sentry; health widget shows adapter metrics.

## P3 — Cleanup & Docs
13. Remove dev fallbacks
    - Steps: Delete dev-login route, src/lib/dev-fallbacks, temp/dev-fallbacks.json post-seed.
    - Acceptance: Build passes; local dev still works; tests adapted.

14. Deprecation notice for legacy bookings API
    - Steps: Document sunset window; add README section and change log.
    - Acceptance: Docs merged; Deprecation headers verified in /api/bookings.

---

## Recently Completed (for context)
- Legacy /api/bookings POST conflict passthrough and tests: 409 surfaced with error.code=CONFLICT for admin/portal via legacy endpoint.
- Booking Wizard enhancements: TeamMemberSelection, Recurrence (with preview), Payment (pricing breakdown & promo), realtime auto-refresh.
- Availability API refactor: central engine, service config, team member support, blackout filter.
- Top navigation: added Booking link.

## Notes
- Program phase tracker remains in docs as reference; execution is driven by the actionable list above.
