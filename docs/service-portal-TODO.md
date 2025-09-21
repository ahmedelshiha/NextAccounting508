# Service Portal — Actionable TODO Checklist

## Booking System Enhancement — High Priority (Linked Plan)
- Plan: [docs/booking_enhancement_plan.md](./booking_enhancement_plan.md)

### P0 — Critical Path
- [ ] Deploy Phase 1 schema via CI (migrate + seed)
  - Next: Set Neon/Netlify envs; run: pnpm db:generate && pnpm db:migrate && pnpm db:seed; verify scheduledAt/isBooking fields live.
  - Deps: Neon DB, Netlify/GitHub secrets; netlify.toml migration steps.
  - Complexity: M • Owner: infra/backend
- [x] AvailabilityEngine (production-grade)
  - Done: Implemented src/lib/booking/availability.ts; refactored admin/portal routes to use it; added unit tests for buffers, weekends, daily caps; deterministic now option.
  - Next: Wire into Multi-step Booking Wizard and PricingEngine; expand blackoutDates once Phase 1 schema lands.
  - Deps: businessHours, blackoutDates, bookingBuffer, maxDailyBookings (Phase 1 schema)
  - Complexity: L • Owner: backend
- [ ] API compat + conflict handling
  - Next: Keep /api/bookings/* forwarding; enforce 409 on slot conflicts; add tests; document deprecation window.
  - Deps: AvailabilityEngine
  - Complexity: S • Owner: backend

### P1 — High Priority
- [x] PricingEngine
  - Done: Implemented src/lib/booking/pricing.ts with weekend/peak, duration overage, emergency, and promo resolver; integrated optional pricing in availability via includePrice; surfaced totals in BookingWizard summary.
  - Next: Add admin settings for pricing modifiers and currency selection UI.
  - Deps: Service.basePrice, duration
  - Complexity: M • Owner: backend
- [ ] ConflictDetectionService
  - Next: Implement src/lib/booking/conflict-detection.ts; call on create/reschedule; add route tests.
  - Deps: Phase 1 schema; AvailabilityEngine
  - Complexity: M • Owner: backend
- [x] Multi-step Booking Wizard
  - Done: Implemented reusable BookingWizard with step components; refactored public booking page to use it; integrated availability fetching and server-side pricing via includePrice; prepared props/interfaces to wire PricingEngine options.
  - Next: Implement TouchCalendar; wire portal create flow to reuse the wizard; expose currency selection and promos.
  - Deps: AvailabilityEngine, PricingEngine
  - Complexity: L • Owner: frontend
- [ ] Recurring bookings
  - Next: Implement src/lib/booking/recurring.ts; accept recurringPattern; create parent/children; skip conflicts with logs.
  - Deps: recurringPattern, parentBookingId; ConflictDetectionService
  - Complexity: L • Owner: backend
- [ ] Smart reminders & preferences
  - Next: Batch per-tenant scheduling; SMS hook (guarded); i18n templates; idempotent sends.
  - Deps: BookingPreferences; SENDGRID_API_KEY
  - Complexity: M • Owner: backend/ops

### P2 — Medium Priority
- [ ] Realtime availability broadcast
  - Next: Implement booking-events; broadcast on create/update; subscribe from calendar grids; test payloads.
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
- [ ] Touch-optimized calendar
  - Next: Implement TouchCalendar; integrate in DateTime step; responsive tests.
  - Deps: AvailabilityEngine
  - Complexity: M • Owner: frontend

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
- [ ] Connect Database & Providers (Neon, Netlify)
  - Next: [Open MCP popover](#open-mcp-popover) → connect Neon + Netlify; set NETLIFY_DATABASE_URL, DATABASE_URL, NETLIFY_BLOBS_TOKEN, UPLOADS_PROVIDER, NEXTAUTH_URL, NEXTAUTH_SECRET, REALTIME_TRANSPORT, REALTIME_PG_URL (optional), CRON_TARGET_URL, CRON_SECRET.
  - Complexity: S • Owner: infra/ops
- [ ] Run CI migrations & seed
  - Next: Trigger CI to run pnpm db:generate && pnpm db:migrate && pnpm db:seed; verify /api/admin/permissions roles present.
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
  - Next: Unskip DB tests; add e2e; enforce thresholds in CI.
  - Complexity: M • Owner: dev/QA
- [ ] Observability & alerts
  - Next: Set SENTRY_DSN; add alerts for AV failures, realtime errors, high error rates.
  - Complexity: S • Owner: ops

### Blockers & Setup Reminders
- Netlify: NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL, REALTIME_TRANSPORT, REALTIME_PG_URL (optional)
- GitHub: DATABASE_URL, CRON_TARGET_URL, CRON_SECRET, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID
- AV: UPLOADS_AV_SCAN_URL + API key reachable from deploy environment
