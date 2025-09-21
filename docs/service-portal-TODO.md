# Service Portal — Reorganized Action Plan (2025-09-21)

This replaces the previous ad-hoc checklist with a prioritized, dependency-aware plan. Each task is specific, actionable, and measurable.

## P0 — Deployment & Schema (Critical Path)
1. Deploy Phase 1 schema (migrate + seed)
   - Steps: pnpm db:generate → db:migrate → db:seed on CI; verify scheduledAt/isBooking present.
   - Acceptance: /api/db-check passes; admin/portal list queries return without schema fallbacks.
   - Deps: Netlify envs set (DATABASE_URL, NEXTAUTH_*, etc.)
   - Status: Pending (requires deploy environment)

2. Proxy compatibility: /api/bookings POST must surface 409 conflicts
   - Steps: Add tests for POST /api/bookings mapping to admin/portal routes and returning 409 on conflicts.
   - Acceptance: New test passes and manual conflict returns { success: false, error.code: 'CONFLICT' }.
   - Deps: ConflictDetectionService
   - Status: Completed (tests/bookings.post-conflict-409.test.ts)

## P1 — API Correctness & Tests
3. Availability route tests for includePrice/promo
   - Steps: Add route tests validating price currency and promoCode application on sample dates.
   - Acceptance: Tests cover base, promo=WELCOME10, promo=SAVE15; currency conversion branch exercised.
   - Status: Completed (tests/bookings-availability.pricing.test.ts)

4. Unit tests: availability engine (buffers, weekends via businessHours, caps)
   - Steps: Add cases for buffer overlap, weekend closed, maxDailyBookings skip.
   - Acceptance: All edge cases green; threshold suite stable.
   - Status: Completed (tests/availability.engine.test.ts)

5. Route tests: create/reschedule 409 (admin and portal)
   - Steps: Ensure both create and reschedule conflict tests exist and cover teamMemberId filter.
   - Acceptance: Tests green and fail when conflict logic is removed.
   - Status: Completed (tests/admin-*/portal-* reschedule/create 409)

## P1 — Uploads & Antivirus
6. Configure uploads provider & antivirus
   - Steps: Set UPLOADS_PROVIDER=netlify, NETLIFY_BLOBS_TOKEN, UPLOADS_AV_SCAN_URL, UPLOADS_AV_API_KEY; run smoke upload and verify quarantine UI.
   - Acceptance: Clean file → status clean; EICAR → quarantined with details; CSV export works.
   - Status: Pending deploy env configuration (code + tests in place)

## P2 — UX, Localization, Preferences
7. BookingPreferences UI (reminders/timezone/channels)
   - Steps: Build settings form; persist; read in cron reminders and ICS generation.
   - Acceptance: Preferences roundtrip; reminders honor windows; ICS uses timezone.
   - Status: Completed (UI + API + cron integration)

8. Localize wizard labels/messages
   - Steps: Use src/app/locales; add keys for all wizard steps incl. Recurrence and Payment.
   - Acceptance: en/ar/hi strings load; fallback behavior verified.
   - Status: Pending

## P2 — PWA & Offline
9. Offline booking cache + background sync
   - Steps (Phase 1): Client-side queue with IndexedDB; Background Sync tag; SW handler to flush; UI fallback when offline.
   - Acceptance: Offline submission enqueues; auto-sends on reconnect; user sees success toast.
   - Status: Started (client queue + SW sync implemented; follow-up UI status indicators pending)

10. Expand SW caching for /api/services and availability
    - Steps: Add runtime cache; respect flag NEXT_PUBLIC_ENABLE_PWA.
    - Acceptance: Cache hit ratio visible in logs; manual validation via devtools.
    - Status: Partially implemented (basic stale-while-revalidate present); enhance with flag + metrics

## P2 — Observability & Ops
11. Sentry and health alerts
    - Steps: Set SENTRY_DSN; add alerting for AV failures, realtime adapter reconnect loops, error rate spikes.
    - Acceptance: Test events arrive in Sentry; health widget shows adapter metrics.
    - Status: Pending deploy env configuration

## P3 — Cleanup & Docs
12. Remove dev fallbacks
    - Steps: Delete dev-login route, src/lib/dev-fallbacks, temp/dev-fallbacks.json post-seed.
    - Acceptance: Build passes; local dev still works; tests adapted.
    - Status: Pending

13. Deprecation notice for legacy bookings API
    - Steps: Document sunset window; add README section and change log.
    - Acceptance: Docs merged; Deprecation headers verified in /api/bookings.
    - Status: Pending

---

## Recently Completed (for context)
- Legacy /api/bookings POST conflict passthrough and tests: 409 surfaced with error.code=CONFLICT for admin/portal via legacy endpoint.
- Booking Wizard enhancements: TeamMemberSelection, Recurrence (with preview), Payment (pricing breakdown & promo), realtime auto-refresh.
- Availability API refactor: central engine, service config, team member support, blackout filter.
- BookingPreferences end-to-end: UI + API + cron reminder integration.
- Create/reschedule conflict tests (admin, portal) with 409 semantics.

## Notes
- Program phase tracker remains in docs as reference; execution is driven by the actionable list above.
