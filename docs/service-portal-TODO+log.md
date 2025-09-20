# Service Portal — TODO + Change Log

## Booking System Enhancement — High Priority (Linked Plan)
- Source plan: [docs/booking_enhancement_plan.md](./booking_enhancement_plan.md)
- Focus: Align portal/admin booking flows with unified ServiceRequest model, advanced availability, pricing, and client UX per the linked plan.

### Completed Work — Booking Context (Summary)
- [x] Unified Service Requests APIs (admin/portal) with RBAC, realtime, CSV export, comments, and tasks; legacy /api/bookings forwarder added with deprecation headers.
- [x] Admin & Portal availability endpoints (GET) added with safe fallbacks; portals wired to query availability before confirm/reschedule.
- [x] Appointment creation via unified Service Requests payload (isBooking, scheduledAt, duration, bookingType) supported in admin and portal create pages.
- [x] Admin/Portal confirm and reschedule endpoints implemented; ICS calendar attachments sent when SENDGRID configured.
- [x] Booking type filters, scheduledAt ordering, analytics/KPIs, and CSV export columns (isBooking, scheduledAt, bookingType) added.
- [x] Booking preferences API (reminderHours, email/SMS flags, locale/timezone) and reminders cron endpoint/workflow implemented.
- [x] Durable realtime transport (Postgres LISTEN/NOTIFY) implemented behind flag; SSE clients wired across admin/portal.
- [x] Prisma schema prepared for Phase 1 booking fields and related models (AvailabilitySlot, BookingPreferences; Service/TeamMember booking fields); migrations staged for CI.

### Remaining Work — Booking Enhancement (Actionable, Prioritized)

P0 — Critical Path (blockers first)
- [ ] Deploy Phase 1 schema to staging/prod via CI (migrate + seed)
  - What: Ensure ServiceRequest booking fields, Service/TeamMember booking fields, AvailabilitySlot, BookingPreferences, and indexes are applied in all envs.
  - Next: Set Neon/Netlify envs, run CI steps: pnpm db:generate && pnpm db:migrate && pnpm db:seed; verify /api/admin/permissions and a sample SR with scheduledAt.
  - Deps: Neon DB, Netlify/GitHub secrets; netlify.toml migration steps.
  - Complexity: M; Owner: infra/backend.
- [ ] Implement production-ready AvailabilityEngine service (per plan §2.1)
  - What: src/lib/booking/availability.ts with business hours, blackout dates, buffers, member working hours, conflict checks; expose via existing availability endpoints.
  - Next: Replace fallback generation with engine; add unit tests for peak/off-hours, buffers, DST, and daily limits; wire price estimation hook.
  - Deps: Phase 1 schema (businessHours, blackoutDates, bookingBuffer, maxDailyBookings).
  - Complexity: L; Owner: backend.
- [ ] Unify API contracts and compat layer
  - What: Keep /api/bookings/* forwarding to unified SR endpoints; document deprecation window; ensure 409 on slot conflicts.
  - Next: Add explicit 409 tests; update docs and response shapes in api-response helpers.
  - Deps: AvailabilityEngine ready.
  - Complexity: S; Owner: backend.

P1 — High Priority (feature UX and core logic)
- [ ] PricingEngine (per plan §2.3)
  - What: Time-based surcharges (peak/weekend), duration overage, emergency multipliers, promo codes; return detailed breakdown.
  - Next: Implement src/lib/booking/pricing.ts; surface price in availability responses and booking wizard summary; add unit tests.
  - Deps: Service.basePrice, standardDuration, hourlyRate; promo validation.
  - Complexity: M; Owner: backend.
- [ ] ConflictDetectionService (per plan §4.4)
  - What: Double-booking, buffer violations, daily capacity exceeded with warnings/errors; canProceed gating.
  - Next: Implement src/lib/booking/conflict-detection.ts; call during create/reschedule; add route tests for conflict paths.
  - Deps: Phase 1 schema; AvailabilityEngine.
  - Complexity: M; Owner: backend.
- [ ] Multi-step Booking Wizard (per plan §3)
  - What: Steps: service selection → date/time → customer details → payment → confirmation; progress UI; validation per step.
  - Next: Build components under src/components/booking/{BookingWizard.tsx, steps/*}; wire to portal create; integrate availability/pricing.
  - Deps: AvailabilityEngine, PricingEngine.
  - Complexity: L; Owner: frontend.
- [ ] Recurring bookings (per plan §4.1)
  - What: Recurrence rules (daily/weekly/monthly), parent/child bookings, conflict skip with logs.
  - Next: Implement src/lib/booking/recurring.ts; extend create API to accept recurringPattern; add tests.
  - Deps: Phase 1 schema (recurringPattern, parentBookingId); ConflictDetectionService.
  - Complexity: L; Owner: backend.
- [ ] Smart reminders & preferences hardening (per plan §4.2)
  - What: Honor per-user preferences, multi-channel, idempotent scheduling; localize content.
  - Next: Extend cron/reminders to batch per tenant; add SMS provider hook (guarded); add i18n templates.
  - Deps: BookingPreferences seeded; SENDGRID_API_KEY; optional SMS provider.
  - Complexity: M; Owner: backend/ops.

P2 — Medium Priority (polish, ops, mobile)
- [ ] Real-time availability broadcast on create/update (per plan §5.1)
  - What: Broadcast availability change to viewers of same service/date; notify assigned team member.
  - Next: Implement booking-events adapter; subscribe from calendar grids; add tests for broadcast payload.
  - Deps: Realtime transport; AvailabilityEngine.
  - Complexity: M; Owner: backend.
- [ ] Live chat support (per plan §5.2)
  - What: Lightweight chat widget with WS/SSE; operator console optional.
  - Next: Implement client component and simple WS endpoint; auth-gate; add rate limits.
  - Deps: Realtime; auth.
  - Complexity: M; Owner: frontend/backend.
- [ ] PWA + offline cache (per plan §6.1–6.2)
  - What: Manifest, service worker, IndexedDB cache for services/user bookings, pending offline bookings queue.
  - Next: Add manifest, register SW, implement OfflineBookingCache; guard behind env flag.
  - Deps: Frontend build; security review.
  - Complexity: M; Owner: frontend.
- [ ] Touch-optimized calendar (per plan §6.3)
  - What: Swipe navigation, larger hit targets, mobile-first grid.
  - Next: Implement TouchCalendar and integrate with DateTime step; add responsive tests.
  - Deps: AvailabilityEngine.
  - Complexity: M; Owner: frontend.

Notes & Blockers
- CI/CD must apply Phase 1 schema in staging before AvailabilityEngine/Pricing/Conflicts can be fully enabled.
- Required envs: DATABASE_URL/NETLIFY_DATABASE_URL, NEXTAUTH_URL/NEXTAUTH_SECRET, SENDGRID_API_KEY/FROM_EMAIL, REALTIME_TRANSPORT, (optional) REALTIME_PG_URL, CRON_SECRET, UPLOADS_*.
- Consider feature flags for PricingEngine, Recurring, and PWA to enable staged rollout.

---

## CURRENT STATUS: PAUSED (as of 2025-09-20)
- Project paused pending CI-run Prisma migrations/seeds, staging environment configuration, and multi-tenancy rollout planning. Follow the Quick Resume Checklist below to resume safely.

## Remaining Work (Paused) — Quick Resume Checklist
- [ ] Step 1 — Connect Database & Providers (infra/ops)
  - Action: Connect Neon and Netlify via MCP and set required envs: NETLIFY_DATABASE_URL, DATABASE_URL, NETLIFY_BLOBS_TOKEN, UPLOADS_PROVIDER, NEXTAUTH_URL, NEXTAUTH_SECRET, REALTIME_TRANSPORT, REALTIME_PG_URL (optional), CRON_TARGET_URL, CRON_SECRET.
  - Why: CI migrations/seeds and runtime features require a real DB and provider tokens.
  - Next: Click [Open MCP popover](#open-mcp-popover) → Connect to Neon and Netlify. Verify envs present in Netlify site settings.
- [ ] Step 2 — Run CI Migrations & Seed (infra/backend)
  - Action: Trigger CI (Netlify/GitHub Actions) to run: pnpm db:generate && pnpm db:migrate && pnpm db:seed.
  - Why: Applies schema changes and seeds roles/templates/permissions required by APIs and UI.
  - Next: Verify /api/admin/permissions and direct DB queries show seeded roles (CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN).
- [ ] Step 3 — Configure Uploads & Antivirus (backend/ops)
  - Action: Set UPLOADS_PROVIDER=netlify (or supabase), NETLIFY_BLOBS_TOKEN, UPLOADS_AV_SCAN_URL, UPLOADS_AV_API_KEY/CLAMAV_API_KEY in Netlify envs.
  - Why: Enables production uploads, AV scanning, and quarantine flows.
  - Next: Upload clean/infected test files and validate AV callback processing & quarantine UI.
- [ ] Step 4 — Enable Durable Realtime (ops)
  - Action: Set REALTIME_TRANSPORT=postgres and REALTIME_PG_URL/REALTIME_PG_CHANNEL if needed.
  - Why: Required for multi-instance reliable realtime via Postgres LISTEN/NOTIFY.
  - Next: Deploy to staging and exercise cross-instance delivery; monitor /api/admin/system/health.
- [ ] Step 5 — Smoke Tests & Validation (QA)
  - Action: Run end-to-end smoke scenarios in staging: portal create → admin assign → status transitions → realtime events → CSV export → uploads/AV.
  - Why: Ensure DB, uploads, AV, realtime, and exports behave end-to-end.
  - Next: Document any failures and create tickets to fix before unpausing.
- [ ] Step 6 — Remove Dev Fallbacks (dev)
  - Action: Remove dev-login, src/lib/dev-fallbacks, temp/dev-fallbacks.json after CI seeds validated.
  - Why: Prevent dev-only paths from being used in production.
  - Next: Re-run CI and verify no regressions.
- [ ] Step 7 — Tests & Coverage (dev/QA)
  - Action: Unskip DB tests, add e2e (Playwright/Cypress), tighten thresholds and include in CI workflow.
  - Why: Ensure regressions are caught before production changes.
  - Next: Fix failing tests and ensure green CI on the branch.
- [ ] Step 8 — Observability & Alerts (ops)
  - Action: Set SENTRY_DSN and configure health checks/alerting for AV failures, realtime errors, and high error rates.
  - Why: Operational visibility and incident response readiness.
  - Next: Verify Sentry events from staging and document runbooks.

Notes & Blockers
- Required secrets/envs must be set in Netlify and GitHub (DATABASE_URL, NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL, CRON_SECRET, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID).
- CI must be granted access to the target Neon DB; migrations should run in CI (preferred) not ad-hoc locally to avoid drift.
- If any step fails, capture logs and create an issue referencing the failing step and error output.

---

## Booking ⇄ Service Request Integration — Master TODO (per docs/booking-service-request-integration-plan v6.md)
Owner: admin • Email: ahmedelsheha@gmail.com • Status: Paused (as of 2025-09-20)

Autonomous Pause Summary (2025-09-20)

Dev environment update (2025-09-20)
- Set runtime env vars via dev server: NETLIFY_DATABASE_URL, DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NETLIFY_BLOBS_TOKEN, REALTIME_TRANSPORT, REALTIME_PG_URL, UPLOADS_PROVIDER, CRON_*.
- Next: Trigger Netlify/GitHub CI to run Prisma generate/migrate/seed; verify seeds via /api/admin/permissions.

Current Status
- PAUSED — awaiting CI-run Prisma migrations/seeds, staging env configuration, and multi-tenancy rollout plan.

Completed Work — Summary
- Admin Service Requests: added filtered CSV export button + enhanced server export to respect filters (status, priority, bookingType, q, dateFrom/dateTo, type) and include scheduledAt/isBooking/bookingType columns with legacy fallback. Files: src/app/admin/service-requests/ClientPage.tsx, src/app/api/admin/service-requests/export/route.ts.
- Admin reschedule now sends ICS calendar email to client (if SENDGRID_API_KEY set). File: src/app/api/admin/service-requests/[id]/reschedule/route.ts.
- Unified Service Requests foundation shipped (admin + portal APIs, RBAC, realtime, comments, tasks, analytics, CSV export).
- Admin/Portal UIs wired (filters, tabs, calendar, booking type analytics, quarantine console, CSV exports).
- Uploads + AV implemented (Netlify Blobs provider, AV callback, rescan cron, quarantine flows).
- Realtime durable transport adapter (Postgres LISTEN/NOTIFY) implemented; SSE endpoints and client hooks.
- Tests added for routes, RBAC, status transitions, auto-assign; new portal confirm/reschedule and admin filters tests.
- CI/Netlify build steps and workflows created; seeds/templates/permissions prepared. Detailed log remains below.

Remaining Work (Paused) — Prioritized Checklist (Scan-first)

P0 — Critical path
- [ ] CI/CD migrations & seed (blocking)
  - What: Run pnpm db:generate && pnpm db:migrate && pnpm db:seed in CI (Netlify or GitHub Actions) against Neon.
  - Next: Set DATABASE_URL/NETLIFY_DATABASE_URL, trigger build, verify roles/templates/permissions via /api/admin/permissions.
  - Deps: Neon DB, Netlify envs, GitHub secrets.
  - Owner: infra/backend
- [ ] Uploads provider & AV in staging
  - What: Set UPLOADS_PROVIDER=netlify, NETLIFY_BLOBS_TOKEN; set UPLOADS_AV_SCAN_URL (+ key) and validate end-to-end.
  - Next: Upload clean/infected samples; verify AV callback, quarantine UI, and cron rescans.
  - Deps: Netlify Blobs token, AV endpoint.
  - Owner: backend/ops

P1 — High priority
- [ ] Multi-tenancy rollout (feature-flagged) — in_progress
  - What: Add tenantId/orgId migrations + indexes; scope queries; enable MULTI_TENANCY_ENABLED in staging.
  - Status: migrations and schema changes already present in prisma/schema.prisma and prisma/migrations/*. Migration files: prisma/migrations/0002_add_tenant_columns, 0003_add_service_tenantid, 20250921_ensure_service_request_cols.
  - Actions taken: added a staging smoke script scripts/check_tenant_scope.js to validate tenant isolation via x-tenant-id header; verified tenantFilter helper and many API routes already include tenant scoping.
  - Next: 1) Connect Neon and Netlify and set MULTI_TENANCY_ENABLED=true in staging (see deployment docs). 2) Trigger CI (pnpm db:migrate / prisma migrate deploy) to apply migrations in staging. 3) Run smoke script against staging URL: TARGET_URL=https://staging.example.com node scripts/check_tenant_scope.js (requires auth token or session cookie). 4) Fix any failing endpoints and run e2e smoke flows (/admin, /portal).
  - Deps: P0 migrations complete, NETLIFY_DATABASE_URL present in CI.
  - Owner: backend
- [ ] Realtime durability in staging
  - What: Set REALTIME_TRANSPORT=postgres (+ REALTIME_PG_URL if needed); validate cross-instance delivery.
  - Next: Exercise multi-node scenario; monitor /api/admin/system/health.
  - Deps: DB connectivity.
  - Owner: ops
- [ ] Tests & coverage tightening
  - What: Unskip DB tests, add e2e for client create→assign→complete; enforce thresholds.
  - Next: Wire into CI workflow; fix regressions.
  - Deps: P0 migrations.
  - Owner: dev/QA

P2 — Medium priority
- [ ] Phase 2 API parity for bookings
  - What: Ensure admin/portal availability/confirm/reschedule endpoints use unified model (isBooking, scheduledAt, bookingType) post-migrations.
  - Next: Remove legacy proxies; keep deprecation headers on /api/bookings.* during window.
  - Deps: P0 migrations.
  - Owner: backend
- [ ] Email & ICS enhancements
  - What: Add ICS to confirmations; reminder scheduler using BookingPreferences; i18n templates.
  - Next: Configure SENDGRID_API_KEY, FROM_EMAIL; add cron for reminders.
  - Deps: Seeds + preferences model.
  - Owner: backend
- [ ] Admin/Portal UI refinements
  - What: Expose bookingType filters by default; ensure scheduledAt ordering in Appointments tab; polish analytics.
  - Next: Verify after Phase 1/2 schema present; add tests.
  - Owner: frontend

P3 — Nice-to-have / Ops
- [ ] Observability & alerts
  - What: Set SENTRY_DSN; add alerts for AV failures, realtime disconnects, high error rates.
  - Next: Verify staging traces and errors; document runbooks.
  - Owner: ops
- [ ] Cleanup dev fallbacks
  - What: Remove dev-login, src/lib/dev-fallbacks, temp/dev-fallbacks.json after CI seeds validated.
  - Next: Re-run CI; ensure no fallback paths remain.
  - Deps: P0 migrations and staging validation.
  - Owner: dev

Blockers & Setup Reminders
- Netlify: set NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL, REALTIME_TRANSPORT, (optional) REALTIME_PG_URL.
- GitHub Secrets: DATABASE_URL, CRON_TARGET_URL, CRON_SECRET, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID.
- AV Service: UPLOADS_AV_SCAN_URL and API key configured and reachable from deploy environment.

Note: Use this checklist to resume. The detailed plan and full change log remain below for context.

Current Status
- Completed: Phase 0 (Readiness), Phase 0.1 (Bridge link in schema/API/UI)
- Updated: Phase 1 migrations applied in CI/dev (2025-09-21) — prisma migrations deployed and seed applied against Neon DB
- Pending: Phases 2–12 (see checklists below)

Remaining Work (Paused) — Quick Checklist
- [ ] Phase 1 — Data Model Unification (migrations + schema changes; run in CI)
- [ ] Phase 2 — API Integration (unified endpoints, availability, confirm/reschedule, guest flow, compat layer)
- [ ] Phase 3 — UI Consolidation (admin views + calendar; portal unified create)
- [ ] Phase 4 — Hooks & State (useBookings/useBooking/useAvailability)
- [ ] Phase 5 — Domain Logic Services (validators, conflicts, auto-assign, recurring)
- [ ] Phase 6 — Email & Notifications (ICS, preferences, cron reminders)
- [ ] Phase 7 — Tests (unit/route/e2e)
- [ ] Phase 8 — Migration & Deployment (netlify.toml, seeds, flags)
- [ ] Phase 9 — Security & Performance (rate limits, indexes, tenancy)
- [ ] Phase 10 — Accessibility & i18n (calendar a11y; locales)
- [ ] Phase 11 — Analytics & BI (KPIs + charts)
- [ ] Phase 12 — Post-Integration Maintenance (deprecate legacy, docs, monitor)

- [x] Phase 0 �� Readiness
  - Review audits and integration plan: docs/booking-service-request-integration-plan v6.md, docs/booking-audit.md, docs/service-requests-audit.md
  - Capture plan in repo and align CI/deploy preconditions

- [x] Phase 0.1 — Bridge (non-breaking)
  - Added Booking.serviceRequestId + relation and indexes in prisma/schema.prisma (bridge link)
  - PUT /api/bookings/[id] accepts serviceRequestId for connect/disconnect
  - Admin Booking detail: Create SR from booking, Link existing SR, View SR

- [ ] Phase 1 — Data Model Unification (absorb booking into ServiceRequest)
  - Extend ServiceRequest with booking fields: isBooking, scheduledAt, duration, clientName, clientEmail, clientPhone, confirmed, reminderSent, bookingType enum, recurringPattern (Json), parentBookingId, parent/child relations, indexes (scheduledAt, isBooking+status, tenant combos, clientId, assignedTeamMemberId)
  - Enhance Service: bookingEnabled, advanceBookingDays, minAdvanceHours, maxDailyBookings, bufferTime, businessHours (Json), blackoutDates[]; @@index([active, bookingEnabled])
  - New AvailabilitySlot model with unique([serviceId, teamMemberId, date, startTime]) and availability indexes
  - Enhance TeamMember: workingHours (Json), timeZone, maxConcurrentBookings, bookingBuffer, autoAssign; indexes
  - New BookingPreferences + relation on User; reminderHours default [24,2]
  - Write migrations in sequence under prisma/migrations/* per plan; keep backwards compatibility

- [ ] Phase 2 — API Integration (unified)
  - Admin SR POST: discriminated union by isBooking with Zod; rate limit; tenant scoping; create recurring children when requested
  - Admin SR GET: filters for isBooking, bookingType, dateFrom/dateTo, q; pagination and ordering by scheduledAt
  - New endpoints: /api/admin/service-requests/availability, /api/admin/service-requests/[id]/confirm, /api/admin/service-requests/[id]/reschedule
  - Portal SR POST: supports guest booking (create-or-find user), stricter rate limits, availability checks, auto-assign
  - Back-compat: /api/bookings/* forwards to unified SR endpoints with deprecation headers

- [ ] Phase 3 — UI Consolidation
  - Admin: enhance src/app/admin/service-requests/page.tsx with view tabs (All/Requests/Appointments) and display modes (list/calendar/analytics)
  - Build BookingCalendarView and integrate; enhance ServiceRequestsTable to render booking columns
  - Portal: ensure create flows can submit bookings via unified SR API
  - Home page: ServiceMarket-style booking entry (Phase 14 in plan)

- [ ] Phase 4 — Hooks & State
  - Added hooks: src/hooks/useBookings.ts, src/hooks/useBooking.ts; pending src/hooks/useAvailability.ts (SWR or simple fetch + refresh)
  - Refactor admin/portal pages to reuse hooks; subscribe to realtime topics booking-* and service-request-*

- [ ] Phase 5 — Domain Logic Services
  - Implement helpers in src/lib/bookings.ts and/or src/lib/service-requests/: validateBookingFields, checkAvailabilityConflicts, getAvailabilitySlots, validateBookingTiming, autoAssignBooking, createRecurringBookings, canUserRescheduleBooking
  - Unit test each helper; ensure tenant-aware behavior

- [ ] Phase 6 — Email & Notifications
  - Extend sendBookingConfirmation/Reschedule/Reminder with ICS attachment; respect BookingPreferences; localize content
  - Cron: reminder scheduler using preferences; reset reminderSent on reschedule

- [ ] Phase 7 — Tests
  - Unit: availability algorithm (DST/weekends/blackouts/buffers), validators, auto-assign booking
  - Route: admin/portal SR booking create/confirm/reschedule with conflict cases; compatibility layer tests
  - E2E: public/portal booking wizard; admin calendar ops; CSVs still OK

- [ ] Phase 8 — Migration & Deployment
  - netlify.toml: ensure pnpm db:generate && pnpm db:migrate && pnpm db:seed on prod builds; skip previews
  - Feature flags: MULTI_TENANCY_ENABLED gating; rollback plan; seed updates (roles/permissions/templates)

- [ ] Phase 9 ��� Security & Performance
  - Rate limits for guest/admin mutations; pagination defaults; indexes on new fields; denylist/validation on inputs
  - Tenancy scoping across all booking-related reads/writes

- [ ] Phase 10 — Accessibility & i18n
  - Ensure calendar keyboard support, focus traps, ARIA; extend locales in src/app/locales/*.json

- [ ] Phase 11 — Analytics & BI
  - Extend /api/admin/stats to include booking KPIs; integrate charts in admin analytics

- [ ] Phase 12 — Post-Integration Maintenance
  - Deprecate legacy /api/bookings after migration window; update docs; monitor success metrics and error rates

Status: Paused (as of 2025-09-20)

Pause reason
- Paused pending CI/CD-run Prisma migrations and seed (ensure DB schema, enums, and seed data applied) and a finalized multi-tenancy rollout plan before further realtime and production uploads work.

Current status
- Local dev: Prisma client generated and seed applied locally; temporary dev-login and in-memory fallbacks added to allow smoke testing without full production schema.
- CI/staging: Awaiting Netlify/CI to run authoritative pnpm db:generate && pnpm db:migrate && pnpm db:seed with NETLIFY_DATABASE_URL (Neon) set. A CI workflow (.github/workflows/ci.yml) has been added to this repo to run migrations, seed, typecheck, lint, tests and build; set DATABASE_URL in GitHub secrets to enable migration steps.
- Realtime/uploads: Postgres adapter implemented (enable via REALTIME_TRANSPORT=postgres). Netlify Blobs provider implemented (requires NETLIFY_BLOBS_TOKEN).

Remaining Work (Paused) — Consolidated Checklist (Updated 2025-09-20)

Quick Resume Checklist (Paused) — Actionable steps to resume safely:

## Remaining Work (Paused) — Actionable Checklist
Below is a concise, prioritized list of unfinished tasks required to resume full production work. Each item is actionable, owner-assigned, and includes the next command or verification step.

1. Connect Database & Provider (infra/ops)
   - What: Connect Neon/Postgres in Netlify and set NETLIFY_DATABASE_URL (and DATABASE_URL), NETLIFY_DATABASE_URL_UNPOOLED (optional), NETLIFY_BLOBS_TOKEN, UPLOADS_PROVIDER, NEXTAUTH_SECRET, NEXTAUTH_URL.
   - Why: CI migration/seed and runtime DB-backed features require a real DB and provider tokens.
   - Next: In Netlify site settings add envs OR use [Open MCP popover](#open-mcp-popover) to connect Neon and Netlify. Verify `pnpm db:generate` runs locally or in CI.

2. Add CI/GitHub Secrets (infra)
   - What: Add DATABASE_URL, CRON_TARGET_URL, CRON_SECRET, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID to GitHub repository secrets.
   - Why: CI workflows (.github/workflows/ci.yml, clamav-rescan.yml, deploy-netlify.yml) require these to run migrations, scheduled rescans, and deploys.
   - Next: Add secrets in GitHub > Settings > Secrets, then trigger CI (push or manual dispatch).

3. Run CI Migrations & Seed (infra/backend)
   - What: Run `pnpm db:generate && pnpm db:migrate && pnpm db:seed` in CI (GitHub Actions or Netlify build). Ensure exit code 0.
   - Why: Applies schema changes (Attachment, QuarantineItem, AVScanLog) and seeds roles/templates/permissions needed by APIs and UI.
   - Next: Trigger CI; verify /api/admin/permissions and direct DB queries show seeded roles CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN.

4. Configure Uploads & AV (infra/backend)
   - What: Set UPLOADS_PROVIDER=netlify (or supabase) and provide NETLIFY_BLOBS_TOKEN (or Supabase vars). Set UPLOADS_AV_SCAN_URL and UPLOADS_AV_API_KEY (CLAMAV_API_KEY) to point at the ClamAV service.
   - Why: Enables production uploads, AV scanning, and quarantine moves.
   - Next: Deploy ClamAV service (see clamav-service/) or point to hosted AV endpoint; set UPLOADS_* envs in Netlify.

5. Validate Staging End-to-End (QA)
   - What: Smoke tests: create portal request, upload attachments (clean & infected test payloads), verify AV webhook updates or quarantine moves, assign via admin, progress status, realtime events, CSV export.
   - Why: Confirms DB, uploads, AV, realtime, and export behavior before production.
   - Next: Run manual scenarios and automated e2e if available; log issues and retest.

6. Enable Durable Realtime (ops)
   - What: Set REALTIME_TRANSPORT=postgres and REALTIME_PG_URL in staging; validate LISTEN/NOTIFY cross-instance delivery and reconnection/backoff.
   - Why: Required for multi-instance realtime reliability in production.
   - Next: Set envs, deploy, and exercise multi-node scenario in staging.

7. Schedule Cron Rescans (ops)
   - What: Add CRON_TARGET_URL and CRON_SECRET; enable/dispatch .github/workflows/clamav-rescan.yml (every 30m) to POST /api/cron/rescan-attachments.
   - Why: Retry avStatus='error' attachments and quarantine infected results automatically.
   - Next: Add secrets, dispatch workflow, and verify run logs and endpoint responses.

8. Observability & Alerts (ops)
   - What: Set SENTRY_DSN, configure health checks for ClamAV and critical endpoints, create alerts for high error/infected rates.
   - Why: Operational visibility and incident response.
   - Next: Add SENTRY_DSN in Netlify and GitHub secrets; verify errors appear in Sentry after a staging test.

9. Tests & e2e (dev/QA)
   - What: Add e2e tests (Playwright/Cypress) covering upload->AV->quarantine + admin triage flows; unskip DB tests and increase coverage thresholds.
   - Why: Ensure regressions are caught in CI before production changes.
   - Next: Add tests to tests/ and include in .github/workflows/ci.yml run steps.

10. Cleanup Dev Fallbacks (dev)
    - What: Remove dev-login, src/lib/dev-fallbacks, temp/dev-fallbacks.json once CI seeds validated and staging is green.
    - Why: Prevent accidental use of dev-only paths in production.
    - Next: Remove code and run full CI; retain migration/rollback plan.

---
- [ ] Connect Neon in Netlify and set required envs: NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL. (owner: infra/ops)
- [ ] Set UPLOADS_PROVIDER and provider secrets (NETLIFY_BLOBS_TOKEN or SUPABASE_*). Set UPLOADS_AV_SCAN_URL and UPLOADS_AV_API_KEY (or CLAMAV_API_KEY) and CRON_TARGET_URL/CRON_SECRET in repo secrets (owner: infra/ops)
- [ ] Trigger CI build that runs: pnpm db:generate && pnpm db:migrate && pnpm db:seed. Verify exit code 0 and seed contents (roles, templates, permissions). (owner: infra/backend)
- [ ] Apply tenant fields behind feature flag: add tenantId/orgId migrations, run migrate in CI, and enable MULTI_TENANCY_ENABLED in staging when ready. Verify API scoping. (owner: backend)
- [ ] Configure uploads in staging: set UPLOADS_PROVIDER=netlify and NETLIFY_BLOBS_TOKEN; validate upload → Netlify Blobs → AV callback → attachments persisted and UI shows per-file status. (owner: backend/ops)
- [ ] Enable durable realtime: set REALTIME_TRANSPORT=postgres (+ REALTIME_PG_URL/REALTIME_PG_CHANNEL if needed) and validate LISTEN/NOTIFY cross-instance delivery, heartbeat, and reconnection behavior. (owner: backend/ops)
- [ ] Run smoke scenarios in staging: client create -> admin assign -> status transitions -> realtime events -> CSV export -> uploads/AV flow. Document findings. (owner: QA)
- [ ] Remove dev helpers and in-memory fallbacks (api/dev-login, src/lib/dev-fallbacks, temp/dev-fallbacks.json) after CI seeds validated. (owner: dev)
- [ ] Tighten tests & coverage: unskip DB tests, add e2e (client/admin full flows), fix failures, and enforce thresholds in CI. (owner: dev/QA)
- [ ] Configure observability: set SENTRY_DSN and verify error/perf capture in staging; add runbook for alerts. (owner: ops)

Notes:
- Each checklist item below the quick resume checklist contains the detailed subtasks and file references. Follow the Quick Resume Checklist first to minimize drift between environments.

[... remainder of existing file content retained below ...]
