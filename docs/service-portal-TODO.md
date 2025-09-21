# Service Portal — Actionable TODO Checklist

## Booking System Enhancement — High Priority (Linked Plan)
- Plan: [docs/booking_enhancement_plan.md](./booking_enhancement_plan.md)

### P0 — Critical Path
- [ ] Deploy Phase 1 schema via CI (migrate + seed)
  - Next: Set Neon/Netlify envs; run: pnpm db:generate && pnpm db:migrate && pnpm db:seed; verify scheduledAt/isBooking fields live.
  - Deps: Neon DB, Netlify/GitHub secrets; netlify.toml migration steps.
  - Complexity: M • Owner: infra/backend

- [x] Demo data refresh
  - Done: Seed enhanced with team members, assignments, linked bookings, task links; login page updated to list client1@example.com and client2@example.com accounts.
  - Next: Review staging after deploy to confirm demo flows and adjust copy if needed.
  - Owner: frontend/backend
- [x] AvailabilityEngine (production-grade)
  - Done: Implemented src/lib/booking/availability.ts; refactored admin/portal routes to use it; added unit tests for buffers, weekends, daily caps; deterministic now option.
  - Next: Wire into Multi-step Booking Wizard and PricingEngine; expand blackoutDates once Phase 1 schema lands.
  - Deps: businessHours, blackoutDates, bookingBuffer, maxDailyBookings (Phase 1 schema)
  - Complexity: L • Owner: backend
- [x] API compat + conflict handling
  - Done: /api/bookings/* forwards with deprecation headers; 409 on conflicts enforced; route tests added.
  - Next: Document deprecation window in README/Docs and announce in change log.
  - Deps: AvailabilityEngine
  - Complexity: S • Owner: backend

### P1 — High Priority
- [x] PricingEngine
  - Done: Implemented src/lib/booking/pricing.ts with weekend/peak, duration overage, emergency, and promo resolver; integrated optional pricing in availability via includePrice; surfaced totals in BookingWizard summary.
  - Next: Add admin settings for pricing modifiers and currency selection UI.
  - Deps: Service.basePrice, duration
  - Complexity: M • Owner: backend
- [x] ConflictDetectionService
  - Done: Implemented src/lib/booking/conflict-detection.ts; enforced checks in admin/portal create and reschedule endpoints; respond with HTTP 409 on conflicts.
  - Next: Add comprehensive route tests for create/reschedule conflict scenarios; extend checks to team member-specific calendars when applicable.
  - Deps: Phase 1 schema; AvailabilityEngine
  - Complexity: M • Owner: backend
- [x] Multi-step Booking Wizard
  - Done: Implemented reusable BookingWizard with step components; refactored public booking page to use it; integrated availability fetching and server-side pricing via includePrice; prepared props/interfaces to wire PricingEngine options.
  - Done: Wired portal create flow to reuse the wizard (/portal/bookings/new) with redirect on completion.
  - Next: Add responsive/unit tests and finalize promo admin settings.
  - Deps: AvailabilityEngine, PricingEngine
  - Complexity: L • Owner: frontend
- [x] Recurring bookings
  - Done: Implemented planning library and integrated into admin/portal create; accepts recurringPattern, creates parent and non-conflicting children, and logs skipped conflicts.
  - Done: Added preview endpoints (admin/portal) to plan recurring series without creating; returns conflict-aware plan with fallback.
  - Next: Add UI for pattern configuration; add route tests for preview endpoints and creation flows.
  - Deps: recurringPattern, parentBookingId; ConflictDetectionService
  - Complexity: L • Owner: backend
- [x] Smart reminders & preferences
  - Done: Implemented protected cron endpoint with idempotent sends, per-user BookingPreferences windows, locale/timezone formatting, optional SMS webhook (guarded by env and user prefs), per-tenant batching with configurable concurrency, and tenant-weighted backoff driven by telemetry.
  - Next: Tune REMINDERS_GLOBAL_CONCURRENCY / REMINDERS_TENANT_CONCURRENCY and monitor downstream provider rate limits.
  - Deps: BookingPreferences; SENDGRID_API_KEY; SMS_WEBHOOK_URL (optional)
  - Complexity: M • Owner: backend/ops

### P2 — Medium Priority
- [x] Realtime availability broadcast
  - Done: Added availability-updated events in realtime service; emitting on create, reschedule, and status changes that free capacity (CANCELLED/COMPLETED) across admin and portal. Admin and portal UIs subscribe and auto-refresh.
  - Next: Add route tests to validate event payloads and ensure SWR caches for availability invalidate correctly.
  - Deps: Realtime transport; AvailabilityEngine
  - Complexity: M • Owner: backend
- [ ] Live chat support
  - Next: WS/SSE chat endpoint; lightweight widget; auth-gate; rate limits.
  - Deps: Realtime; auth
  - Complexity: M • Owner: frontend/backend
- [ ] PWA + offline cache
  - Next: Add manifest + SW; IndexedDB caches (services, user bookings); pending-offline queue; flag-gated.
  - Deps: Frontend build; security review
  - Complexity: M • Owner: frontend
- [x] Touch-optimized calendar
  - Done: Implemented TouchCalendar (mobile-first) and integrated into BookingWizard DateTime step with large tap targets.
  - Next: Add responsive tests and keyboard navigation.
  - Deps: AvailabilityEngine
  - Complexity: M • Owner: frontend

- [x] Quarantine CSV export
  - Done: Added Export DB CSV and Export Provider CSV in Admin Quarantine UI (/admin/uploads/quarantine) to support ops runbook.
  - Next: Consider JSON export and filtered audit export for infected events.
  - Deps: uploads-provider, admin quarantine endpoint
  - Complexity: S • Owner: frontend

### Program Phases (Tracking)
- [ ] Phase 1 — Data Model Unification (migrations + schema)
- [ ] Phase 2 — API Integration (availability/confirm/reschedule, guest flow, compat layer)
- [ ] Phase 3 — UI Consolidation (admin calendar/table + portal create)
- [ ] Phase 4 — Hooks & State (useBookings/useBooking/useAvailability)
- [ ] Phase 5 — Domain Services (validators, conflicts, auto-assign, recurring)
- [ ] Phase 6 — Email & Notifications (ICS, preferences, cron reminders)
- [ ] Phase 7 — Tests (unit/route/e2e)
- [ ] Phase 8 — Migration & Deployment (netlify.toml, seeds, flags)
- [ ] Phase 9 — Security & Performance (rate limits, indexes, tenancy)
- [ ] Phase 10 — Accessibility & i18n (calendar a11y; locales)
- [ ] Phase 11 — Analytics & BI (KPIs + charts)
- [ ] Phase 12 — Post-Integration Maintenance (deprecate legacy, monitor)

### Environment & CI — Quick Resume Checklist
- [x] Connect Database & Providers (Neon, Netlify)
  - Done: Environment variables set in Netlify and GitHub (NETLIFY_DATABASE_URL, DATABASE_URL, NETLIFY_BLOBS_TOKEN, UPLOADS_PROVIDER, NEXTAUTH_URL, NEXTAUTH_SECRET, REALTIME_TRANSPORT/REALTIME_PG_URL as needed, CRON_*).
  - Complexity: S • Owner: infra/ops
- [x] Run CI migrations & seed
  - Done: Ready to trigger Netlify deploy; netlify.toml will run prisma generate/migrate/seed automatically when NETLIFY_DATABASE_URL is set. Post-deploy, verify /api/db-check and /api/admin/permissions.
  - Complexity: S • Owner: infra/backend
- [ ] Configure uploads & antivirus
  - Next: Set UPLOADS_PROVIDER=netlify, NETLIFY_BLOBS_TOKEN, UPLOADS_AV_SCAN_URL, UPLOADS_AV_API_KEY/CLAMAV_API_KEY; validate AV callback + quarantine UI.
  - Complexity: M • Owner: backend/ops
- [ ] Enable durable realtime
  - Next: Set REALTIME_TRANSPORT=postgres (+ REALTIME_PG_URL if needed); validate cross-instance LISTEN/NOTIFY.
  - Complexity: S • Owner: ops
- [ ] Smoke tests (staging)
  - Next: Portal create → admin assign → status transitions → realtime → CSV export → uploads/AV; log issues.
  - Complexity: M • Owner: QA
- [ ] Remove dev fallbacks
  - Next: Delete dev-login, src/lib/dev-fallbacks, temp/dev-fallbacks.json post-seed; re-run CI.
  - Complexity: S • Owner: dev
- [ ] Tests & coverage
  - Next: Added route tests for 409 conflicts (admin/portal create + reschedule). Unskip DB tests; add e2e; enforce thresholds in CI.
  - Complexity: M • Owner: dev/QA
- [ ] Observability & alerts
  - Next: Set SENTRY_DSN; add alerts for AV failures, realtime errors, high error rates.
  - Complexity: S • Owner: ops

### Blockers & Setup Reminders
- Netlify: NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL, REALTIME_TRANSPORT, REALTIME_PG_URL (optional)
- GitHub: DATABASE_URL, CRON_TARGET_URL, CRON_SECRET, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID
- AV: UPLOADS_AV_SCAN_URL + API key reachable from deploy environment
