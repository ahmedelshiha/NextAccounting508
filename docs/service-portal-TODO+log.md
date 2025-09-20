# Service Portal — TODO + Change Log

## Booking ⇄ Service Request Integration — Master TODO (per docs/booking-service-request-integration-plan v6.md)
Owner: admin • Email: ahmedelsheha@gmail.com • Status: Paused (as of 2025-09-20)

Current Status
- Completed: Phase 0 (Readiness), Phase 0.1 (Bridge link in schema/API/UI)
- Pending: Phases 1–12 (see checklists below)

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

- [x] Phase 0 — Readiness
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
  - Add hooks: src/hooks/useBookings.ts, src/hooks/useBooking.ts, src/hooks/useAvailability.ts (SWR or simple fetch + refresh)
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

- [ ] Phase 9 — Security & Performance
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
1. CI/CD: Prisma migrations & seeds
   - [ ] Run pnpm db:generate && pnpm db:migrate && pnpm db:seed in Netlify (staging/prod) and confirm exit code 0
   - [ ] Apply tenantId/orgId columns + indexes via migration; verify in staging DB
   - [ ] Validate seeds (roles, templates, permissions) via /api/admin/permissions and direct queries
2. Multi-tenancy rollout
   - [ ] Enable MULTI_TENANCY_ENABLED in staging; verify API scoping end-to-end
   - [ ] Backfill tenantId for existing rows if applicable
3. Uploads & Antivirus
   - [ ] Set NETLIFY_BLOBS_TOKEN, UPLOADS_PROVIDER=netlify, UPLOADS_AV_SCAN_URL
   - [ ] Verify upload → AV callback → quarantine → UI statuses (client + admin)
   - [x] Implement background retry for avStatus: 'error' (via /api/cron/rescan-attachments)
4. Realtime durability
   - [ ] Set REALTIME_TRANSPORT=postgres (+ REALTIME_PG_URL/REALTIME_PG_CHANNEL if needed)
   - [ ] Validate cross-instance LISTEN/NOTIFY delivery; add alerts/metrics
5. QA & Tests
   - [ ] Raise coverage thresholds; unskip DB tests; ensure CI green
   - [ ] Add e2e: client create/approve → admin assign/progress/complete → realtime
6. Docs & Ops
   - [ ] Finalize deployment checklist and rollback steps (docs/netlify-deployment-and-envs.md)
   - [ ] Add Sentry runbook; document required envs (NEXTAUTH_SECRET/URL, REALTIME_*, NETLIFY_BLOBS_TOKEN)
7. Cleanup
   - [ ] Remove dev helpers (/api/dev-login, src/lib/dev-fallbacks, temp/dev-fallbacks.json) after DB validated
   - [ ] Replace remaining file fallbacks with DB-only paths
8. Post-migration validation
   - [ ] Smoke test admin/portal; CSV export; uploads; realtime in staging
9. Observability
   - [ ] Configure SENTRY_DSN; verify error/perf capture and alerts

Completed (high level)
- Core service-requests APIs (admin + portal) implemented and wired with RBAC, realtime broadcasts, attachments, and comments.
- Prisma schema extended and seeds added; local seed applied after resolving enum baseline.
- Uploads endpoint with provider switch, AV sniffing, and per-file error reporting implemented.
- Dev helpers added to enable local smoke tests (dev-login, dev-fallbacks persisted to temp/dev-fallbacks.json).
- Unit & route tests added for permissions, auto-assignment, status transitions; some tests skipped until CI DB is authoritative.

Remaining Work (Paused) — Actionable checklist (for resuming)
1. Database & Migrations (critical)
   - [ ] Run migrations + seed in CI (Netlify): add Netlify build step to run `pnpm db:generate && pnpm db:migrate && pnpm db:seed` and verify exit code 0.
     - How: In Netlify CI settings / netlify.toml, ensure NETLIFY_DATABASE_URL points to Neon and include the command above in build hooks.
   - [ ] Validate seeds: confirm users (CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN), templates, permissions exist via `/api/admin/permissions` and direct DB queries.
   - [ ] Remove or rework dev-only fallbacks after CI seed confirmed.

2. Multi-tenancy (high)
   - [ ] Implement tenantId/orgId fields and indexes behind feature flag in Prisma schema; add migration; scope all admin/portal queries by tenant when flag enabled.
   - [ ] Add middleware to derive tenant from request (header/subdomain/auth) and enforce DB scoping.
   - Next command: update prisma schema + `pnpm db:migrate` in CI and verify queries are correctly filtered.

3. Uploads & AV (high)
   - [ ] Set `NETLIFY_BLOBS_TOKEN` and `UPLOADS_PROVIDER=netlify` in Netlify env for staging/prod.
   - [ ] Verify upload end-to-end: upload -> Netlify Blobs -> AV webhook -> attachments AV status persisted -> UI shows per-file result.
   - [x] Add retry/remediation runbook for AV 'error' and quarantine flow. (docs/uploads-runbook.md)

4. Realtime & Ops (high)
   - [ ] Enable durable transport in staging: set `REALTIME_TRANSPORT=postgres` and optional `REALTIME_PG_URL`/`REALTIME_PG_CHANNEL`.
   - [ ] Validate LISTEN/NOTIFY cross-instance delivery, heartbeat events, reconnection/backoff, and monitor metrics surfaced in /api/admin/system/health.

5. QA & Tests (required before merge)
   - [ ] Tighten coverage thresholds and enable tests in CI; fix any DB-related test failures.
   - [ ] Add e2e tests for client create -> admin assign -> complete flows (playwright/cypress/puppeteer) and include in CI pipeline.

6. Docs & Runbooks
   - [ ] Publish deployment checklist: required env vars, build steps, migrations, smoke tests, rollback steps (add to docs/netlify-deployment-and-envs.md).
   - [ ] Document upload provider setup and AV webhook contract (docs/uploads-runbook.md).

7. Clean-up (post-migration)
   - [ ] Remove dev helpers (`/api/dev-login`, `src/lib/dev-fallbacks`, `temp/dev-fallbacks.json`) after CI migrations validated.
   - [ ] Convert any remaining fallback code paths to DB-backed implementations and add migrations where needed.

Quick resume steps (recommended order)
- Step A: Ensure Neon is connected in Netlify & set NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL.
- Step B: Trigger CI build that runs `pnpm db:generate && pnpm db:migrate && pnpm db:seed` and confirm seed data.
- Step C: Run smoke tests in staging: create portal request, assign via admin, progress status, verify realtime and CSV export.
- Step D: Remove dev helpers and push cleanup commit; re-run CI and verify tests pass.

Notes
- Dev fallbacks were intentionally added to enable offline smoke testing; keep them only while migrations are in flight. They persist to `temp/dev-fallbacks.json`.
- When resuming, prefer running migrations in CI (Netlify) rather than local ad-hoc migrations to keep schema consistent across environments.

- [x] 2025-09-20: Project paused; consolidated Remaining Work (Paused) checklist updated for quick resumption.
  - Updated: docs/service-portal-TODO+log.md (status set to Paused, actionable checklist refreshed)
  - Why: Awaiting CI-run Prisma migrations/seeds, multi-tenancy rollout plan, and staging env configuration before continuing.
  - Next: Follow Quick Resume Checklist to re-enable progress.

- [x] 2025-09-20: Admin Service Requests UI enhanced with Type tabs and View modes; Calendar view added; fallback API supports `type` filter.
  - Updated: src/app/admin/service-requests/page.tsx; src/components/admin/service-requests/calendar-view.tsx; src/app/api/admin/service-requests/route.ts
  - Why: Prepare UI for unified booking/request workflow and provide calendar visualization without new DB fields; maintain compatibility.
  - Next: Extend DB query to filter by isBooking/scheduledAt after migrations; enhance table with booking columns; wire portal create flow to unified SR API.

- [x] 2025-09-20: Added hooks useServiceRequests and useServiceRequest (SWR-based) for admin paths.
  - Updated: src/hooks/useServiceRequests.ts; src/hooks/useServiceRequest.ts
  - Why: Provide reusable data access for list/detail views and future components; aligns with Phase 4.
  - Next: Implement useAvailability once /api/admin/service-requests/availability is available.

- [x] 2025-09-20: Added date range filters (dateFrom/dateTo) to admin Service Requests (UI + API) and wired query params; fallback filters by deadline/createdAt.
  - Updated: src/components/admin/service-requests/filters.tsx; src/app/admin/service-requests/page.tsx; src/app/api/admin/service-requests/route.ts
  - Why: Align with Phase 2 requirement for date filtering ahead of scheduledAt migrations; improves triage and reporting.
  - Next: After migrations add scheduledAt, extend DB WHERE to use scheduledAt and add bookingType filter.

- [x] 2025-09-20: Added admin endpoints for availability, confirm, and reschedule; introduced useAvailability hook.
  - Added: src/app/api/admin/service-requests/availability/route.ts; src/app/api/admin/service-requests/[id]/confirm/route.ts; src/app/api/admin/service-requests/[id]/reschedule/route.ts; src/hooks/useAvailability.ts
  - Why: Progress Phase 2 unified API (availability/confirm/reschedule) and Phase 4 hooks for booking flows; endpoints work with DB and include safe fallbacks where feasible.
  - Next: Portal POST support for guest bookings using unified SR API; later migrate to ServiceRequest.scheduledAt and booking statuses.



Completed (Highlights)
- Admin Audits: server-side pagination/search, server CSV export, and UI wiring
- Realtime: Postgres adapter with SSE keepalive pings; metrics surfaced in Admin
- Uploads: Netlify Blobs provider with magic-byte sniffing, AV webhook support, stricter MIME/ext; portal shows per-file errors
- Observability: Optional Sentry integration with dynamic import; routed error capture in key endpoints
- Tests: Route/unit tests added for templates, team-management, service-requests; new admin-activity shape test
- Performance/Stability: Increased client fetch timeout with retries; hydration warning fix in BlogSection

Paused Notes:
- Project paused to complete database migrations/seeds and plan multi-tenancy before further UI/realtime work.
- prisma generate/migrate/seed cannot run in this environment due to ACL; run in CI/CD or dev shell when available.
- On resume: generate Prisma client, apply migrations, seed roles/permissions, then implement realtime filtering/durable transport.
- Neon DATABASE_URL configured in env; pending CI/CD run to execute prisma generate/migrate/seed.

This file tracks the full implementation plan derived from:
- docs/service_portal_implementation_guide.md
- docs/website-audit.md
- docs/admin-dashboard-audit.md

All tasks are unchecked until implemented. Update this log after each change with date, files, and brief notes.

## Current Status: Paused (2025-09-20)

### ClamAV Integration — Deployment TODOs (added 2025-09-20)
- [ ] Deploy ClamAV service (Docker) and expose /health, /scan, /update endpoints; configure CLAMAV_API_URL/UPLOADS_AV_SCAN_URL and API key.
- [ ] Set upload provider envs (UPLOADS_PROVIDER, NETLIFY_BLOBS_TOKEN or Supabase vars) and NEXTAUTH secrets in staging/Netlify.
- [ ] Add GitHub Actions secrets CRON_TARGET_URL and CRON_SECRET; update clamav-rescan workflow pre-check to avoid failing when secrets are absent.
- [ ] Run CI to execute pnpm db:generate && pnpm db:migrate && pnpm db:seed; verify Attachment/Quarantine models and seeds applied.
- [ ] Validate staging flows: upload clean/infected files, AV callback handling, quarantine moves, and cron rescans.
- [ ] Decide AV failure policy (strict reject vs lenient enqueue) and implement chosen policy in uploads route.
- [ ] Configure monitoring (Sentry/SLA alerts) and add runbook for AV incidents and quarantine handling.
- [ ] Remove dev fallbacks (dev-login, temp/dev-fallbacks.json) after CI validation.

Note: These ClamAV steps are required before enabling full production uploads and quarantine automation. Follow the Quick Resume Checklist afterwards to complete remaining paused work.

Added helper scripts and workflows
- scripts/check-required-envs.sh: prints required environment variables and exits non-zero if missing (useful in CI pre-checks).
- .github/workflows/clamav-rescan.yml: cron workflow (every 30m) that pre-checks CRON_TARGET_URL/CRON_SECRET before POSTing to /api/cron/rescan-attachments.
- .github/workflows/deploy-netlify.yml: Netlify deploy workflow with pre-check for NETLIFY_AUTH_TOKEN/NETLIFY_SITE_ID; runs migrations/seeds when NETLIFY_DATABASE_URL present.

Next: Set secrets in GitHub (CRON_TARGET_URL, CRON_SECRET, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID) and Netlify (NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, UPLOADS_PROVIDER, UPLOADS_AV_SCAN_URL, UPLOADS_AV_API_KEY).

## Current Status: Paused (2025-09-20)

ClamAV Deployment Plan (Analyze & Plan)
- Setup ClamAV service (container) behind a simple HTTP API (/health, /scan, /update)
- Configure hosting env vars: UPLOADS_PROVIDER, NETLIFY_BLOBS_TOKEN, UPLOADS_AV_SCAN_URL, (optional) UPLOADS_AV_API_KEY
- Wire Next.js APIs:
  - /api/uploads runs pre-store AV scan against UPLOADS_AV_SCAN_URL
  - /api/uploads/av-callback handles async provider callbacks (optional)
  - /api/cron/rescan-attachments retries avStatus: 'error' and quarantines infected
- Schedule rescans with GitHub Actions (clamav-rescan.yml) using secrets CRON_TARGET_URL and CRON_SECRET
- Netlify/Vercel: add CRON_SECRET; set envs; map AV service URL (proxy if needed)
- Optional: add /api/cron/av-update to trigger signature refresh when desired

Dependencies
- ClamAV container (Docker) and simple wrapper service with API key
- Hosting env variables (Netlify/GitHub secrets) set
- Storage provider configured (Netlify Blobs) for quarantine moves


Summary
- Project is paused pending CI/CD execution of Prisma generate/migrate/seed and validation in staging.
- Local environment supports DB-disabled fallbacks; full feature verification requires NETLIFY_DATABASE_URL + CI migration run (Neon recommended).
- Uploads provider: Netlify Blobs implemented (requires NETLIFY_BLOBS_TOKEN in Netlify env to enable). Realtime Postgres adapter implemented but requires REALTIME_TRANSPORT=postgres in staging.
- Recent changes: logout/realtime cleanup, middleware cache-control, tests added for many APIs. Some UI unit tests are excluded from local runs and run in CI.

Actionable "Remaining Work (Paused)" Checklist �� Priority ordered
1. Database & Migrations (critical)
   - [ ] Ensure CI runs Prisma client generation and migrations: configure Netlify build to run "pnpm db:generate && pnpm db:migrate && pnpm db:seed".
   - [ ] Verify seed data applied: roles (CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN), default templates, and permissions.
   - [ ] Run smoke queries against staging DB and validate RBAC via /api/admin/permissions endpoints.

2. Multi-tenancy (high)
   - [ ] Implement tenantId/orgId fields and indexes in Prisma schema behind a feature flag.
   - [ ] Add middleware and API scoping to ensure all admin/portal queries filter by tenant when enabled.
   - [ ] Add DB indexes for tenant scoping and performance testing.

3. Uploads & AV (high)
   - [ ] Set NETLIFY_BLOBS_TOKEN in Netlify env and enable UPLOADS_PROVIDER=netlify.
   - [ ] Validate Netlify Blobs uploads end-to-end (upload, AV webhook response handling, UI per-file error display, retry/remove controls).
   - [ ] Add runbook for upload failures and quarantine flow.

4. Realtime & Ops (high)
   - [ ] Set REALTIME_TRANSPORT=postgres and (optional) REALTIME_PG_URL/REALTIME_PG_CHANNEL in staging env.
   - [ ] Validate cross-instance LISTEN/NOTIFY delivery, heartbeat events, and reconnection/backoff in staging.
   - [ ] Instrument metrics/alerts for realtime errors and connection count.

5. QA & Tests (required before merge)
   - [ ] Tighten coverage thresholds and enable tests in CI. Fix any failing tests related to DB expectations.
   - [x] Add unit tests for status transitions and RBAC guards (some added: auto-assignment tests done).
   - [ ] Add end-to-end tests for full client create -> admin assign -> complete flows.

6. Docs & Runbooks (required)
   - [ ] Document required env vars and values (NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, REALTIME_* , NEXTAUTH_SECRET/URL).
   - [ ] Add deployment checklist for Netlify: preflight checks, run migrations, verify health endpoints, run smoke tests, rollback steps.

7. Observability & Audit (recommended)
   - [ ] Configure Sentry DSN in staging and production; verify error/performance capture and set alerts.
   - [ ] Ensure logout/audit events are persisted when DB is available; add queries to surface logout events in /admin/audits.

8. Final smoke & staging validation
   - [ ] Smoke test portal and admin flows end-to-end in staging with DB and uploads enabled.
   - [ ] Verify CSV export, realtime updates, and attachments.

Notes
- Many code paths already support DB-disabled fallback (file-based templates/notifications) to allow local dev without secrets.
- To resume: connect Neon in Netlify, set required envs, trigger Netlify build to run migrations and seeds, then run smoke tests.


## Remaining Work (Paused)
1) Database and Migrations
- [ ] Run Prisma generate/migrate/seed in CI/CD; verify tables/enums and seed data applied
- [ ] Seed permissions and default roles (CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN)
- [ ] Implement multi-tenancy scoping behind feature flag; add tenantId/orgId to models and indexes; scope queries

2) Uploads and File Storage
- [x] Implement Netlify Blobs in /api/uploads (use NETLIFY_BLOBS_TOKEN); generate object key, set contentType, return public URL
- [ ] Add optional antivirus scan step and stricter extension policy; audit log uploads and failures
- [x] Update portal UI to display per-file upload status/errors; retry/remove controls

3) Realtime and Ops
- [ ] Set REALTIME_TRANSPORT=postgres (and REALTIME_PG_URL/REALTIME_PG_CHANNEL if different from DATABASE_URL)
- [ ] Validate multi-instance delivery in staging; monitor reconnect/backoff; confirm cross-instance events

4) QA and Testing
- [x] Add unit tests for auto-assignment
- [x] Add unit tests for status transitions and RBAC guards
- [ ] Tighten coverage thresholds in tests/thresholds.test.ts and ensure passing locally/CI
- [ ] Add e2e tests for client request create/approve and admin assign/progress/complete flows

5) Documentation and Runbooks
- [x] Document required env vars and values: DATABASE_URL, NETLIFY_BLOBS_TOKEN, REALTIME_*; provider setup steps
- [ ] Add deployment checklist (preflight, migration, health checks) and rollback steps

6) Nice-to-haves
- [ ] Integrate Sentry for error/perf monitoring; add alerting on API error rates
- [ ] Surface audit log UI under /admin/audits with filters and export

How to Resume
- Step 1: Connect to Neon and run CI/CD build to apply Prisma migrations/seeds
- Step 2: Configure Netlify envs (NETLIFY_BLOBS_TOKEN, REALTIME_TRANSPORT=postgres) and redeploy
- Step 3: Implement Netlify Blobs code path in /api/uploads and push PR; validate uploads in staging
- Step 4: Add missing tests and raise thresholds; merge PR after green CI

## Remaining work (paused)

- Resume checklist (ordered):
  1. Connect database (Neon) and run prisma generate/migrate/seed in CI/CD.
  2. Seed roles/permissions and default templates; verify RBAC via permissions API.
  3. Implement durable realtime adapter (Redis or Postgres LISTEN/NOTIFY) and set REALTIME_TRANSPORT. [Adapter implemented: Postgres; enable via REALTIME_TRANSPORT=postgres]
  4. Decide/uploads provider and virus-scan policy; enable production uploads with limits. [Server-side content-type sniffing added; choose Netlify Blobs or Supabase Storage for production].
  5. Replace file-based templates with DB-backed endpoints — completed.
  6. Replace mock dashboard data with real APIs and guards; standardize zod error shapes.
  7. Add unit, route, and e2e tests; fix failures; enforce thresholds.
  8. Update docs to reflect endpoints, flows, and ops runbooks.

- [ ] Database/Prisma
  - Extend User and Service models; add UserPermission model; add enums ExpertiseLevel, AvailabilityStatus, ServiceStatus, DefaultRole
  - Plan multi-tenancy (tenantId/orgId + indexes) and scope queries behind a flag
  - Define attachments storage strategy and persist attachment metadata schema
  - Run prisma generate/migrate; seed permissions and default roles

- [ ] Permissions/Middleware
  - No remaining items here; roles aligned and middleware checks completed.

- [ ] Realtime
  - [x] Implement durable transport adapter (Redis or Postgres) and configure REALTIME_TRANSPORT for multi-instance
  - [x] Add connection health checks and reconnection backoff in portal/admin SSE clients; plan idempotency for multi-instance delivery

- [ ] Admin UI
  - No remaining items here.


- [ ] Cleanup & Consistency
  - [x] Replace file-based task comments with DB-backed endpoints
  - [x] Replace file-based templates with DB-backed endpoints
  - [x] Replace file-based notifications with DB-backed endpoints
  - Replace mock dashboard data with real APIs and guards; standardize zod validation/error shapes

- [ ] Testing & Docs
  - Unit tests (permissions, auto-assign, status transitions, RBAC)
  - Route tests (service-requests, team-management, templates)
  - E2E tests for client/admin flows; docs updates

## TODO (unchecked)

### 1) Database and Prisma schema
- [x] Add models ServiceRequest and RequestTask with enums RequestPriority, RequestStatus (prisma/schema.prisma)
- [x] Extend prisma/schema.prisma with remaining models/fields: TaskComment (service-requests), UserPermission; enums ExpertiseLevel, AvailabilityStatus, ServiceStatus, DefaultRole
- [x] Extend TaskTemplate model with service-portal fields (description, category, defaultPriority, defaultCategory, estimatedHours, checklistItems, requiredSkills, defaultAssigneeRole)
- [x] Add fields to User and Service models per guide (employeeId, department, position, skills, expertiseLevel, hourlyRate, availabilityStatus, maxConcurrentProjects, hireDate, manager relation; Service.requiredSkills/status)
- [ ] Plan multi-tenancy: introduce tenantId/orgId on relevant tables (users, services, service_requests, tasks) with indexes; scope queries behind feature flag
- [ ] Define attachments storage strategy (provider, size limits, virus scan) and persist attachment metadata schema
- [x] Add DB indexes as in guide (status, priority, assigned_team_member_id, deadline, client_id)
- [ ] Generate and verify Prisma client (pnpm prisma generate)
- [ ] Create migration for new tables/columns and run locally (db push or migrate)
- [x] Seed minimal data for templates (client onboarding, VAT return, quarterly audit)
- [ ] Seed permissions and default roles (CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN)

### 2) Admin API: Service Requests
- [x] Create folder structure src/app/api/admin/service-requests/
- [x] Implement route.ts (GET list w/ filters, POST create w/ zod validation)
- [x] Implement [id]/route.ts (GET, PATCH, DELETE)
- [x] Implement [id]/assign/route.ts (POST assign to team member + audit)
- [x] Implement [id]/tasks/route.ts (GET related tasks, POST create from template/plain)
- [x] Implement [id]/comments/route.ts (GET/POST comments) including attachment handling
- [x] Implement [id]/status/route.ts (PATCH status transitions) with server-side validation of workflow
- [x] Implement bulk/route.ts (bulk operations)
- [x] Implement export/route.ts (CSV export)
- [x] Implement analytics/route.ts (aggregates for dashboard)
- [x] Implement auto-assignment logic (skills, availability, workload) with unit tests and fallbacks
- [x] Enforce RBAC via permissions.ts on all endpoints; consistent error shapes

### 3) Admin API: Team Management and Templates
- [x] Create src/app/api/admin/team-management/{availability,skills,workload,assignments}/route.ts
- [x] Compute utilization and workload using maxConcurrentProjects; include active assignments detail
- [x] Create admin task templates endpoints (using existing path /api/admin/tasks/templates with categories).}
- [x] Seed and manage template categories endpoint; filter by requiredSkills when creating from template (pending UI integration)

### 4) Permissions and Middleware
- [x] Add src/lib/permissions.ts (PERMISSIONS, ROLE_PERMISSIONS, helpers)
- [x] Implement permissions API: src/app/api/admin/permissions/{route.ts,[userId]/route.ts,roles/route.ts}
- [x] Migrate remaining admin API routes to use permissions.ts consistently; remove legacy rbac usage
- [x] Verify RBAC migration across admin routes (imports from src/lib/permissions, no ADMIN/STAFF string guards, standardized 401 responses)
- [x] Align roles to CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN; update seeds and use-permissions hook
- [x] Wire enhanced checks inside src/app/middleware.ts for /admin and /portal service routes
- [x] Add PermissionGate component (src/components/PermissionGate.tsx) and use in admin UIs (tables, action buttons)

### 5) Real-time
- [x] Add enhanced realtime service src/lib/realtime-enhanced.ts
- [x] Add SSE endpoint src/app/api/admin/realtime/route.ts
- [x] Create client hook src/hooks/useRealtime.ts and test basic events
- [x] Broadcast events: service-request-updated, task-updated, team-assignment; subscribe in admin pages
- [x] Implement per-user event filtering and clean shutdowns; plan durable transport for multi-instance

### 6) Admin UI: Dashboard and Pages
- [x] Update src/app/admin/page.tsx to render service request KPIs and charts (calls new analytics/workload endpoints)
- [x] Add admin pages: src/app/admin/service-requests/{page.tsx,[id]/page.tsx,new/page.tsx}
- [x] Add admin page: src/app/admin/service-requests/[id]/edit/page.tsx
- [x] Build components: components/admin/service-requests/{table.tsx,filters.tsx,bulk-actions.tsx,overview.tsx,team-workload-chart.tsx,request-status-distribution.tsx}
- [x] Wire realtime updates on service-requests page using useRealtime
- [x] Permission-gate actions (assign, delete, export)
- [x] Integrate ServiceRequestTaskCreator into admin/task flows where relevant

### 7) Client Portal
- [x] Add portal listings: src/app/portal/service-requests/page.tsx (client-only list)
- [x] Add detail: src/app/portal/service-requests/[id]/page.tsx with comment thread and status
- [x] Add create flow: src/app/portal/service-requests/new/page.tsx (client creates requests; attachments enhancement pending)
- [x] Add client approval action and status view (sets clientApprovalAt)
- [x] Notify client on assignment/status updates — email + in-app notifications implemented
- [x] Implement attachments handling in create flow with validations; display in detail view

### 8) Cleanup and Consistency (from audits)
- [x] Remove or consolidate src/app/lib/* duplicates into src/lib/* and fix imports
- [x] Replace file-based task comments/templates/notifications with DB-backed endpoints
- [x] Replace mock dashboard data with real API and guards
- [x] Standardize zod validation and error shapes across new routes
  - Applied to service-requests (admin/portal) list/create and id/comment/assign/status/tasks endpoints via src/lib/api-response.ts
- [x] Apply rate limiting (src/lib/rate-limit.ts) to mutation-heavy endpoints
- [x] Emit audit events for create/assign/status changes (surface in /admin/audits)

### 9) Testing and docs
- [x] Add unit tests for new lib/permissions and helpers
- [x] Add unit tests for auto-assignment
- [x] Add unit tests for status transitions and RBAC guards
- [x] Add route tests for service-requests
- [x] Add route tests for team-management
- [x] Add route tests for templates
- [ ] Add e2e tests for client create/approve request and admin assign/complete
- [ ] Update docs/ to reflect new endpoints and flows

## Change Log
- [x] 2025-09-20: Admin Service Requests table shows Scheduled column when available.
  - Updated: src/components/admin/service-requests/table.tsx
  - Why: Surface appointment times within list view to support mixed request/appointment triage.
  - Next: After migrations add ServiceRequest.scheduledAt and isBooking; extend API ordering/filtering by scheduledAt.
- [x] 2025-09-20: Added 'type' filter (appointments vs requests) to admin service-requests GET DB path using deadline presence as a temporary proxy.
  - Updated: src/app/api/admin/service-requests/route.ts
  - Why: Align DB-backed listing with UI tabs before scheduledAt migration; keeps behavior consistent with fallback path.
  - Next: Switch to scheduledAt/isBooking filters post-migration and order by scheduledAt desc for appointments.
- [x] 2025-09-20: Booking ⇄ Service Request linking (Phase 1: lightweight link).
  - Updated: prisma/schema.prisma (Booking.serviceRequestId + relation + indexes)
  - Updated: src/app/api/bookings/[id]/route.ts (PUT accepts serviceRequestId for admin/staff; connects/disconnects relation)
  - Updated: src/app/admin/bookings/[id]/page.tsx (Create Service Request from booking, Link existing SR by ID, View linked SR)
  - Why: Start integration per docs/booking-service-request-integration-plan v6.md with a non-breaking bridge while larger absorption (extending ServiceRequest) migrates in CI.
  - Next: Standardize booking APIs to use respond/zod; add service-layer (src/lib/bookings.ts); extend portal/admin flows to surface linked SR; plan Phase 2 data model absorption behind migrations.
- [x] 2025-09-19: Portal list pagination UI and CSV export rate limiting.
  - Updated: src/app/portal/service-requests/ServiceRequestsClient.tsx (server-driven pagination: page/limit state, URL sync, controls)
  - Updated: src/app/api/portal/service-requests/export/route.ts (IP-based rate limit to protect CSV export)
  - Why: Improve usability and performance for large lists; protect export endpoint from abuse.
  - Next: Add e2e tests for export filtering and pagination; consider streaming CSV for very large datasets.
- [x] 2025-09-19: Added pagination and result counts to Admin Quarantine console and API.
  - Updated: src/app/api/admin/uploads/quarantine/route.ts (db pagination: page/limit, provider in-memory paging; returns meta)
  - Updated: src/app/admin/uploads/quarantine/QuarantineClient.tsx (UI pagers, totals, query-param sync for db/provider pages)
  - Why: Improve usability and performance when many quarantined items exist; enables operators to navigate efficiently.
  - Next: Implement provider cursor-based pagination when available and sortable columns; consider server-side provider filtering.
- [x] 2025-09-19: Fixed Next.js build error (missing Suspense with useSearchParams) on portal/service-requests.
- [x] 2025-09-20: Added quarantine console link when infected attachments are detected in portal views.
- [x] 2025-09-20: Quarantine deep-link and filtering implemented.
- [x] 2025-09-20: Quarantine bulk actions and admin SR link.
  - Updated: src/app/admin/uploads/quarantine/QuarantineClient.tsx (selection state, select-all, bulk release/delete)
  - Updated: src/app/api/admin/uploads/quarantine/route.ts (accepts keys[] for bulk operations)
  - Updated: src/app/admin/service-requests/[id]/page.tsx (attachments section includes Open Quarantine link prefiltered by serviceRequestId)
  - Why: Speed up remediation; consistent operator workflow from SR detail to quarantine console.
  - Next: Add pagination for provider listing and result counts.
  - Added: src/app/admin/uploads/quarantine/QuarantineClient.tsx (client UI with filters; Suspense-wrapped page)
  - Updated: src/app/admin/uploads/quarantine/page.tsx (server wrapper with <Suspense>)
  - Updated: src/app/api/admin/uploads/quarantine/route.ts (supports serviceRequestId and q filters)
  - Updated: src/app/portal/service-requests/[id]/page.tsx (links pass serviceRequestId)
  - Why: Enable RBAC-safe deep linking for faster remediation of infected files tied to a specific request.
  - Next: Add bulk actions and preselect filter from admin SR detail page.
  - Updated: src/app/portal/service-requests/[id]/page.tsx (shows red notice; if user role is not CLIENT, provides button linking to /admin/uploads/quarantine)
  - Why: Streamline operator remediation flow from context; clients still see status without elevated controls.
  - Next: Consider provider pagination and DB-driven sorting; add confirm modals with counts.
  - Added: src/app/portal/service-requests/ServiceRequestsClient.tsx (client component)
  - Updated: src/app/portal/service-requests/page.tsx (server component wraps <ServiceRequestsClient /> in <Suspense> with skeleton fallback)
  - Why: Next.js 15 requires useSearchParams within a Suspense boundary to avoid CSR bailout during static generation; Netlify build failed.
  - Next: Monitor Netlify build; scan for other useSearchParams usages in pages and apply the same pattern if needed.
- [x] 2025-09-19: Added ClamAV client utility and refactored upload/rescan to use it.
  - Added: src/lib/clamav.ts (scanBuffer with retries, timeout, API key header support)
  - Updated: src/app/api/uploads/route.ts (uses scanBuffer; preserves strict type checks)
  - Updated: src/app/api/cron/rescan-attachments/route.ts (uses scanBuffer; keeps quarantine flow)
  - Why: Centralize AV logic, retries, and normalization across endpoints.
  - Next: Configure UPLOADS_AV_SCAN_URL and (optional) UPLOADS_AV_API_KEY in staging.
- [x] 2025-09-20: Add Prisma AV fields + migration and persist AV metadata.
  - Updated: prisma/schema.prisma (Attachment: avScanAt DateTime?, avThreatName String?, avScanTime Float?)
  - Added: prisma/migrations/20250920_add_av_fields/migration.sql (ALTER TABLE to add columns)
  - Updated: src/app/api/uploads/route.ts (persist avStatus, avDetails, avScanAt, avThreatName, avScanTime on create)
  - Updated: src/app/api/cron/rescan-attachments/route.ts (persist avScanAt/avThreatName/avScanTime on rescan)
  - Updated: src/app/api/uploads/av-callback/route.ts (persist av metadata on AV callback; update JSON attachments fallback)
  - Why: Provide searchable, queryable AV metadata and timestamps for audits and remediation.
  - Next: Run `pnpm prisma migrate deploy` in CI (Netlify) or run `pnpm prisma migrate dev --name add-av-fields` locally to apply DB changes; verify seeds and run smoke tests for uploads, rescans, and quarantine workflows.
- [x] 2025-09-19: Scheduled rescans via GitHub Actions.
  - Added: .github/workflows/clamav-rescan.yml (runs every 30m; manual dispatch supported)
  - Why: Ensure background retries for avStatus 'error' without relying on external schedulers.
  - Next: Set repository secrets CRON_TARGET_URL and CRON_SECRET; validate run logs.
- [x] 2025-09-20: Added portal CSV export API and updated UI to prefer server export with client fallback.
  - Added: src/app/api/portal/service-requests/export/route.ts; Updated: src/app/portal/service-requests/page.tsx
  - Why: Handle large exports reliably server-side; preserve UX by falling back to client CSV when needed.
  - Updated: src/app/portal/service-requests/page.tsx (filters UI for status/q; passthrough to server export; debounced search; URL sync)
  - Why: Ensure CSV export reflects current filtered view and improve usability.
  - Next: Validate in staging.
- [x] 2025-09-20: Added background AV re-scan cron and marked TODO complete.
  - Updated: docs/service-portal-TODO+log.md; implemented via src/app/api/cron/rescan-attachments/route.ts
  - Why: Automatically retry avStatus 'error' items and support quarantine workflow per uploads runbook.
  - Next: Cron scheduled via GitHub Actions workflow (.github/workflows/cron-rescan.yml). Add repository secrets CRON_TARGET_URL (base app URL) and CRON_SECRET (x-cron-secret). Dispatch the workflow in Actions to validate and monitor logs in staging.
- [x] 2025-09-20: Marked project as Paused and added a consolidated "Remaining Work (Paused)" checklist for quick resumption.
  - Updated: docs/service-portal-TODO+log.md (status/date, consolidated checklist)
  - Why: Provide a single, actionable list of unfinished items and clear current status for future resume.
  - Next: Connect CI (Netlify + Neon) and run migrations/seeds; proceed through checklist in order.
- [x] 2025-09-19: Scoped team-management endpoints by tenant and added Node runtime.
  - Updated: src/app/api/admin/team-management/{workload,availability,skills,assignments}/route.ts
  - Why: Enforce tenant isolation consistently across admin APIs; safe no-op unless MULTI_TENANCY_ENABLED is true.
  - Next: Extend tenant scoping to remaining admin endpoints (users, stats) and run Prisma migration in CI to add tenantId fields.
- [x] 2025-09-19: Scoped admin users and stats endpoints by tenant and set Node runtime.
  - Updated: src/app/api/admin/users/{route.ts,[id]/route.ts}, src/app/api/admin/stats/{users,posts,bookings}/route.ts
  - Why: Ensure analytics and user management respect tenant boundaries; changes are no-ops until MULTI_TENANCY_ENABLED is true or schema adds tenantId.
  - Next: Add tenant scoping to any remaining admin endpoints (services, activity) and run CI Prisma migration adding tenantId + indexes.
- [x] 2025-09-19: Scoped admin services, activity, and export by tenant; set Node runtime.
  - Updated: src/app/api/admin/{services,activity,export}/route.ts
  - Why: Complete tenant isolation across admin listing/analytics/export endpoints; safe until schema migrates.
  - Next: Run Prisma migration in CI to add tenantId to affected tables and indexes; validate in staging.
- [x] 2025-09-20: Scoped remaining admin service-requests routes for multi-tenancy.
  - Updated: src/app/api/admin/service-requests/[id]/assign/route.ts, [id]/status/route.ts, [id]/tasks/route.ts, [id]/comments/route.ts, bulk/route.ts, export/route.ts, analytics/route.ts
  - Why: Enforce tenant isolation across admin APIs; safe no-op when MULTI_TENANCY_ENABLED is false or schema lacks tenantId.
  - Next: Add tenant scoping to any remaining admin endpoints and run Prisma migration in CI to add tenantId fields.
- [x] 2025-09-19: Standardized API error handling and improved portal comments attachments UI.
- [x] 2025-09-19: Multi-tenancy scaffolding behind feature flag (no DB changes yet).
  - Added: src/lib/tenant.ts (helpers: isMultiTenancyEnabled, getTenantFromRequest, tenantFilter)
  - Updated: src/app/middleware.ts (inject x-tenant-id from subdomain when enabled)
  - Updated: src/app/api/portal/service-requests/{route.ts,[id]/route.ts} (tenant-aware list/create and detail checks, safe until schema adds tenantId)
  - Why: Prepare for tenant scoping without breaking current schema; enables gradual rollout.
  - Next: Extend scoping across remaining admin/portal APIs and seeds; run Prisma migrate in CI to apply tenantId fields.
- [x] 2025-09-19: Tenant-aware uploads and portal comments validation.
  - Updated: src/app/api/uploads/route.ts (persist Attachment.tenantId when enabled)
  - Updated: src/app/api/portal/service-requests/[id]/comments/route.ts (validate tenant for GET/POST)
  - Why: Keep files and comment access isolated per tenant.
  - Next: Scope remaining admin routes (status/assign/tasks/bulk/export/analytics) and portal list filters where applicable.
  - Updated: src/lib/api-error.ts (new helper getApiErrorMessage)
  - Updated: src/app/portal/service-requests/new/page.tsx, src/app/portal/service-requests/[id]/page.tsx, src/app/portal/page.tsx (use helper for toasts; clearer messages)
  - Updated: src/app/portal/service-requests/[id]/page.tsx (render comment attachments with AV status indicators)
  - Why: Consistent, user-friendly errors across portal; improved transparency for attachments scan results.
  - Next: Apply helper across remaining admin pages; add localization for error messages.
- [x] 2025-09-18: Resolved GitHub Actions CI merge conflict in .github/workflows/ci.yml.
  - Updated: unified job env and steps; fixed cache-dependency-path: pnpm-lock.yaml; removed conflict markers.
  - Why: PR showed <<<<<<< / ======= / >>>>>>> markers causing CI to be invalid YAML.
  - Next: Re-run CI; if green, enable deploy workflow or auto-merge rules.

- [x] 2025-09-18: Fixed unreadable toast on Portal New Service Request (Error: [object Object]).
  - Updated: src/app/portal/service-requests/new/page.tsx (extract server error.message from API error shape)
  - Why: API returns { error: { code, message } }; UI was passing the whole object to toast, showing [object Object].
  - Next: Audit other pages for similar pattern and standardize with a small helper.

- [x] 2025-09-18: Hardened Netlify Prisma migrate to avoid advisory lock timeouts (P1002) in previews.
  - Updated: netlify.toml
    - Use unpooled connection for migrate when NETLIFY_DATABASE_URL_UNPOOLED is available
    - Skip migrate/seed on deploy-preview and branch-deploy contexts
    - Increase PRISMA_MIGRATION_ENGINE_ADVISORY_LOCK_TIMEOUT to 60000ms
  - Why: Netlify deploy-previews failed with P1002 acquiring advisory lock on Neon. This avoids running migrations in previews and reduces lock contention in prod.
  - Next: Verify deploy-preview builds succeed; confirm production deploy runs migrate/seed successfully.
- [x] 2025-09-18: Added GitHub Actions CI with pnpm to fix missing pnpm error and enforce build/tests.
  - Added: .github/workflows/ci.yml (checkout, setup-node, pnpm/action-setup, install, prisma generate/migrate/seed, typecheck, lint, tests, build, artifact upload)
  - Why: GitHub runs failed with "Unable to locate executable file: pnpm"; ensures CI parity and reliable builds.
  - Next: Add deploy-on-merge job and caching for Prisma if needed.

- [x] 2025-09-18: Fixed Netlify build failure due to secrets scanning false-positives.
  - Updated: netlify.toml ([build.environment] SECRETS_SCAN_OMIT_KEYS = "UPLOADS_PROVIDER,REALTIME_TRANSPORT")
  - Why: Netlify secrets scanner flagged these env keys across build output, causing exit code 2.
  - Next: Monitor deploy; if additional keys or paths are flagged, extend SECRETS_SCAN_OMIT_KEYS or add SECRETS_SCAN_OMIT_PATHS for build artifacts.

- [x] 2025-09-18: Added optional Netlify deploy workflow from GitHub Actions.
  - Added: .github/workflows/deploy-netlify.yml (build + deploy via netlify/actions/cli when NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID are set)
  - Why: Enable deploy-on-push to main or manual dispatch directly from GitHub.
  - Next: Set required secrets in GitHub repo and test a manual dispatch in staging.
- [x] 2025-09-18: Portal create fallback now uses internal services route; added tests for portal comments.
  - Updated: src/app/api/portal/service-requests/route.ts (fallback no longer fetches localhost)
  - Added: tests/portal-comments.route.test.ts
  - Why: Remove external localhost dependency in serverless envs and strengthen coverage of client comment flow.
  - Next: Add e2e covering client approve -> admin assign -> complete with realtime assertions.

- [x] 2025-09-18: Portal SR detail PATCH now supports DB-disabled fallback and emits realtime updates.
  - Updated: src/app/api/portal/service-requests/[id]/route.ts (fallback update via dev store, realtime emit)
  - Updated: src/lib/dev-fallbacks.ts (updateRequest helper)
  - Added: tests/portal-service-request-id.route.test.ts
  - Why: Ensure client approvals/cancellations work without DB and keep UI synced via SSE.
  - Next: Add UI toast on approval and refine status badges.

- [x] 2025-09-18: Netlify CI build runs Prisma migrate/seed when NETLIFY_DATABASE_URL is set.
  - Updated: netlify.toml ([build].command conditional db:generate/migrate/seed + app build)
  - Why: Automate schema application and seeds in CI; skips when DB env not present to avoid failures.
  - Next: Set NETLIFY_DATABASE_URL in Netlify and redeploy; verify seeds via /api/admin/permissions.
- [x] 2025-09-18: Portal New Service Request — added upload progress indicator, debounced service search, and auto pre-upload on selection.
  - Updated: src/app/portal/service-requests/new/page.tsx
  - Why: Improve UX by surfacing upload progress, reducing search re-renders, and accelerating readiness by uploading on selection.
  - Next: Consider resumable/chunked uploads, surface AV scan status per file, and optionally disable submit while required uploads are pending.

- [x] 2025-09-18: Disable submit while uploads are pending on Portal New Request.
  - Updated: src/app/portal/service-requests/new/page.tsx (canSubmit guards pending uploads; button label reflects state; helper text)
  - Why: Prevent submitting before files finish uploading, avoiding missing attachments.
  - Next: Show AV scan status when callback updates are received.

- [x] 2025-09-18: Portal SR detail now surfaces AV status for attachments when available.
  - Updated: src/app/portal/service-requests/[id]/page.tsx (shows Clean/Infected/pending based on avStatus/avDetails)
  - Why: Improve transparency of virus-scan results for client attachments.
  - Next: Add admin quarantine controls link from client view when infected.

- [x] 2025-09-18: Enforced Node runtime and added error capture in portal routes.
  - Updated: src/app/api/portal/service-requests/route.ts; src/app/api/portal/service-requests/[id]/route.ts; src/app/api/portal/service-requests/[id]/comments/route.ts (export runtime='nodejs', captureError calls)
  - Why: Ensure Prisma-compatible runtime on Netlify and better observability.

- [x] 2025-09-18: Added CSV export to client portal service-requests list.
  - Updated: src/app/portal/service-requests/page.tsx (Export CSV button)
  - Why: Allow clients to download their requests for records.

- [x] 2025-09-18: Portal comments support attachments with upload progress and validation.
  - Updated: src/app/portal/service-requests/[id]/page.tsx (comment file uploads, progress, disabled while pending)
  - Updated: tests/portal-comments.route.test.ts (attachments accepted)
  - Why: Enable sharing supporting docs within the discussion thread with proper UX.
  - Next: Show AV scan status per comment attachment once callback updates the record.

- [x] 2025-09-18: Database migrations & seed run in dev; resolved enum and baseline issues.
  - Actions: Ran prisma generate, prisma migrate deploy (baseline resolved), and prisma db:seed.
  - Files: prisma/schema.prisma (added STAFF enum), prisma/migrations/0001_add_attachment_table, prisma/seed.ts
  - Why: Bring local dev DB to a seeded state for smoke testing.
  - Next: Run full CI migration pipeline and validate in staging.

- [x] 2025-09-18: Dev login endpoint and in-memory fallback for service-requests added to enable smoke tests without full DB schema.
  - Updated: src/app/api/dev-login/route.ts, src/lib/dev-fallbacks.ts, src/app/api/portal/service-requests/route.ts, src/app/api/portal/service-requests/[id]/route.ts, src/app/api/portal/service-requests/[id]/comments/route.ts
  - Why: Allow automated smoke tests and local validation when some DB tables/columns are not yet migrated. The endpoint issues a dev session cookie for staff user; the fallback persists entries to temp/dev-fallbacks.json.
  - Next: Remove dev-login and fallback code after CI migrations complete and staging validated.
- [x] 2025-09-19: Documented required env vars and Netlify deployment checklist.
  - Updated: docs/netlify-deployment-and-envs.md
  - Why: Provide clear deployment steps and required env vars for CI/CD (Prisma generate/migrate/seed), uploads provider config, and realtime settings to resume project.
  - Next: Add runbook for upload failure handling and Sentry staging configuration.

- [x] 2025-09-20: Added GitHub Action for optional Netlify deploy and uploads runbook.
  - Added: .github/workflows/deploy-netlify.yml
  - Added: docs/uploads-runbook.md
  - Why: Allow optional automated deploy when NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID are provided, and document quarantine/AV handling.
  - Next: Implement admin quarantine UI and AV callback endpoint; add background retry queue for avStatus: 'error'.

- [x] 2025-09-20: Implemented AV callback endpoint and admin quarantine UI (best-effort, provider-dependent).
  - Added: src/app/api/uploads/av-callback/route.ts
  - Added: src/app/api/admin/uploads/quarantine/route.ts
  - Added: src/app/admin/uploads/quarantine/page.tsx
  - Why: Allow AV providers to notify server of scan results and provide admins tools to inspect, delete, or release quarantined files.
  - Next: Persist attachment avStatus in DB and add background retry queue for avStatus 'error'.

- [x] 2025-09-20: Persisted AV scan results to ServiceRequest.attachments when matches found (best-effort JSON update).
  - Updated: src/app/api/uploads/av-callback/route.ts
  - Why: Improve traceability — attachments now receive avStatus and avDetails when AV callback includes object key.
  - Next: Add background retry queue for avStatus 'error' and consider an Attachment DB model + migration for stronger guarantees.

- [x] 2025-09-18: Portal New Service Request — added per-file upload retry controls and service typeahead search.
  - Updated: src/app/portal/service-requests/new/page.tsx
  - Why: Improve UX and fulfill uploads UI checklist (status/errors + retry/remove). Helps users verify uploads before submit and find services faster.
  - Next: Add upload progress indicator and debounce search; consider pre-uploading files on selection.

- [x] 2025-09-19: Added unit tests for service-request status transitions and RBAC guards.
  - Added: tests/status-transitions.test.ts
  - Why: Ensure server-side status update endpoint enforces RBAC and validates payloads (unauthenticated, client, team_member, admin cases).
  - Next: Add route-level tests for bulk actions and full status workflow (admin assign -> in_progress -> complete) and integrate into CI thresholds.
  - Updated: src/app/portal/service-requests/new/page.tsx
  - Why: Improve UX and fulfill uploads UI checklist (status/errors + retry/remove). Helps users verify uploads before submit and find services faster.
  - Next: Add upload progress indicator and debounce search; consider pre-uploading files on selection.
- [x] 2025-09-18: Enhanced Admin New Service Request page to fetch clients and services; replaced raw ID inputs with selects.
  - Updated: src/app/admin/service-requests/new/page.tsx
  - Why: Client ID and Service ID did not fetch any data; aligns with service_portal_implementation_guide.md to ensure proper wiring and UX.
  - Next: Add typeahead search for large lists; debounce queries; preselect client when navigated from client context.
- [x] 2025-09-18: Fixed SR-linked task creation (DB fallback + schema).
  - Updated: src/app/api/admin/service-requests/[id]/tasks/route.ts
  - Why: Creating tasks failed when DB not configured; also accept flexible priority (low/medium/high/critical) and dueDate alias.
  - Next: Add UI error surface for API validation details; e2e test for create-task flow (admin).
- [x] 2025-09-18: Enhanced Admin View Service Request page: attachments viewer and comments panel wired to API.
  - Updated: src/app/admin/service-requests/[id]/page.tsx
  - Why: Ensure all features (attachments, comments, realtime refresh) are visible and usable from the detail view.
  - Next: Add comment editing/deletion and pagination for long threads; consider template-based task creation.
- [x] 2025-09-17: Added unit tests for auto-assignment logic.
  - Added: tests/auto-assignment.test.ts
  - Why: Validate skill-match preference and least-workload fallback.
  - Next: Add tests for status transitions and RBAC guards
- [x] 2025-09-17: Added server-side CSV export for audits with filters.
  - Updated: src/app/api/admin/export/route.ts (supports entity=audits with type/status/q/limit)
  - Updated: src/app/admin/audits/page.tsx (export button uses server endpoint)
  - Why: Handle large datasets and ensure RBAC via server.
  - Next: Consider streaming for very large exports.
- [x] 2025-09-17: Optional Sentry integration (server/client) guarded by SENTRY_DSN.
  - Added: src/lib/observability.ts (dynamic import of @sentry/*; captureError helper)
  - Updated: activity/export/uploads routes to capture errors when present
  - Why: Improve error visibility without hard runtime dependency.
  - Next: If desired, add @sentry/nextjs dependency and wrap next.config.js.
- [x] 2025-09-17: Added Prisma indexes for HealthLog queries.
  - Updated: prisma/schema.prisma (indexes on checkedAt and service/status)
  - Why: Improve performance for audits listing/export queries.
  - Note: Requires prisma migrate in CI/CD to take effect.
- [x] 2025-09-17: Completed antivirus scan + stricter MIME/extension policy; surfaced upload errors in portal UI.
  - Updated: src/app/api/uploads/route.ts (AV scan via UPLOADS_AV_SCAN_URL; strong type/extension checks)
  - Updated: src/app/portal/service-requests/new/page.tsx (per-file error display)
  - Why: Security and UX.
  - Next: Consider async AV callbacks and quarantine storage.
- [x] 2025-09-17: Added server-side pagination and search for Admin Audits.
  - Updated: src/app/api/admin/activity/route.ts (page, limit, q, status; returns data+pagination)
  - Updated: src/app/admin/audits/page.tsx (server-side filtering, pagination controls; CSV export kept)
  - Why: Improve performance and scalability for large audit volumes.
  - Next: Add server-side CSV export and DB indexes on checkedAt and status.
- [x] 2025-09-17: Reduced client fetch aborts causing Failed to fetch in app router.
  - Updated: src/lib/api.ts (browser timeout 45s; DOMException reason preserved)
  - Updated: src/app/status/page.tsx (use apiFetch with retries)
  - Why: Mitigate transient network/slow dev responses and avoid AbortError noise.
  - Next: Set NEXTAUTH_URL and NEXTAUTH_SECRET in deploy env to silence NextAuth warnings.
- [x] 2025-09-17: Fixed hydration warnings in BlogSection caused by dev data-loc attributes.
  - Updated: src/components/home/blog-section.tsx (suppressHydrationWarning on header nodes)
  - Why: Prevent SSR/client attribute mismatches in dev overlays.
  - Next: Consider dynamic import with ssr:false if further mismatches surface.
- [x] 2025-09-17: Added unit test for Admin Activity pagination/search shape.
  - Added: tests/admin-activity.route.test.ts
  - Why: Guard regression on API shape as volume grows.
  - Next: Add more tests for filters and DB-backed path when CI runs Prisma.
- [x] 2025-09-17: Added SSE keepalive pings to admin/portal realtime endpoints.
  - Updated: src/app/api/{admin,portal}/realtime/route.ts (': ping' every 25s; clean on abort)
  - Why: Prevent idle timeouts and improve multi-instance validation stability.
  - Next: Emit periodic heartbeat events to test cross-instance delivery in staging.
- [x] 2025-09-17: Fixed Netlify TypeScript build errors in uploads/audit.
  - Updated: src/app/api/uploads/route.ts (added missing import { logAudit } from '@/lib/audit')
  - Updated: src/lib/audit.ts (removed duplicate prisma import causing TS2300)
  - Why: Netlify build failed with TS2304 (logAudit not found) and TS2300 (Duplicate identifier 'prisma').
  - Next: Push to origin and redeploy on Netlify. Ensure UPLOADS_PROVIDER=netlify and NETLIFY_BLOBS_TOKEN are set. Validate build passes; then proceed to enable REALTIME_TRANSPORT=postgres and verify multi-instance delivery.
- [x] 2025-09-17: Removed Turbopack warning for @netlify/blobs by deferring import fully.
  - Updated: src/app/api/uploads/route.ts (use Function('return import(...)') to avoid static resolution; returns 501 with hint if SDK unavailable)
  - Why: Build warned "Module not found: Can't resolve '@netlify/blobs'" though deploy succeeded.
  - Next: Optionally add @netlify/blobs to dependencies for local dev; keep UPLOADS_PROVIDER=netlify + NETLIFY_BLOBS_TOKEN in Netlify env. Set REALTIME_TRANSPORT=postgres and (optional) REALTIME_PG_URL.
- [x] 2025-09-17: Implemented Admin Audits UI with filters and CSV export.
  - Updated: src/app/admin/audits/page.tsx (service/status filters, RBAC-backed /api/admin/activity, CSV export)
  - Why: Surface audit logs for operators; leverage existing healthLog store and permissions.
  - Next: Add pagination and server-side CSV export if logs grow; continue with REALTIME_TRANSPORT=postgres validation.
- [x] 2025-09-17: Added Smart Actions entries for audits and service requests.
  - Updated: src/app/admin/page.tsx (SmartQuickActions)
    - Management tab: added Service Requests (/admin/service-requests) and Audit Logs (/admin/audits)
    - Primary tab: added New Service Request (/admin/service-requests/new)
  - Why: Faster operator access to audits and request workflows.
  - Next: Track usage and consider role-based visibility for Smart Actions.
- [x] 2025-09-17: Surfaced realtime transport/connection metrics in Admin header.
  - Updated: src/app/admin/page.tsx (ProfessionalHeader fetches /api/admin/system/health and displays transport + connection count)
  - Why: Aid validation of multi-instance realtime (LISTEN/NOTIFY) on Netlify.
  - Next: Manually verify shows 'postgres' in staging; then add simple heartbeat emit on key actions.
- [x] 2025-09-17: Fixed Admin Audits page Select crash (empty value not allowed).
  - Updated: src/app/admin/audits/page.tsx (status Select uses 'ALL' instead of empty string; filtering updated accordingly)
  - Why: Radix Select requires non-empty value for SelectItem; empty caused client-side exception.
  - Next: Add pagination and server-side search for audits if volume grows.
- [x] 2025-09-17: Added SSE runtime and realtime health metrics.
  - Updated: src/app/api/{admin,portal}/realtime/route.ts (runtime='nodejs' to ensure Node runtime on Netlify)
  - Updated: src/lib/realtime-enhanced.ts (metrics: connectionCount, totalEvents, lastEventAt)
  - Updated: src/app/api/admin/system/health/route.ts (exposes realtime metrics)
  - Notes: Helps ops monitor realtime behavior; no functional change to event delivery.
- [x] 2025-09-17: Implemented Netlify Blobs upload provider.
  - Updated: src/app/api/uploads/route.ts (dynamic import of @netlify/blobs, safe filename, public URL response)
  - Added: src/types/netlify-blobs-shim.d.ts (shim types for CI typecheck)
  - Notes: Requires UPLOADS_PROVIDER=netlify and NETLIFY_BLOBS_TOKEN set in Netlify env. Falls back with 501 if not configured.
- [x] 2025-09-17: Implemented Postgres LISTEN/NOTIFY realtime adapter and factory selection.
  - Updated: src/lib/realtime-enhanced.ts (PostgresPubSub adapter; factory supports REALTIME_TRANSPORT 'postgres'|'pg'|'neon')
  - Updated: package.json (added dependency: pg@^8.12.0)
  - Notes: Default remains in-memory; to enable durable transport set REALTIME_TRANSPORT=postgres and optionally REALTIME_PG_URL/REALTIME_PG_CHANNEL. Next: set env on Netlify and validate multi-instance delivery.
- [x] 2025-09-17: Hardened uploads endpoint with magic-byte content sniffing and stricter validation.
  - Updated: src/app/api/uploads/route.ts (file-type detection, MIME whitelist, size checks)
  - Updated: package.json (added dependency: file-type@^18.7.0)
  - Notes: Choose provider (Netlify Blobs or Supabase Storage) and set UPLOADS_PROVIDER on deploy.
- [x] 2025-09-17: Added route tests for templates and team-management endpoints (fallback mode).
  - Added: tests/templates.route.test.ts, tests/team-management.routes.test.ts
  - Notes: Mocks permissions, auth, fs, and DB disabled path; validates responses and structures.
- [x] 2025-09-17: Portal comments now emit realtime refresh for related service request.
  - Updated: src/app/api/portal/service-requests/[id]/comments/route.ts (emit service-request-updated after create)
- [x] 2025-09-17: Connected Neon DB in dev via dev-server env; increased fetch timeout; fixed prisma import in tasks API.
  - Updated: src/lib/api.ts (default client timeout 15s; env override NEXT_PUBLIC_FETCH_TIMEOUT)
  - Updated: src/app/api/admin/tasks/route.ts (added prisma import)
  - Set env: NETLIFY_DATABASE_URL, DATABASE_URL (restart applied). Secrets not committed.
  - Notes: Prisma generate/migrate/seed will run in Netlify build per netlify.toml.
  - Next: Trigger Netlify build to apply migrations/seeds; verify analytics and portal flows against DB.
- [x] 2025-09-17: Fixed Netlify build error TS2300 (duplicate identifier 'prisma') in /api/admin/tasks/route.ts by removing a duplicate import.
  - Updated: src/app/api/admin/tasks/route.ts (single prisma import)
  - Notes: Re-deploy to confirm Next.js compile succeeds.
- [x] 2025-09-16: Fixed remaining Netlify TypeScript build errors (admin UI and API routes).
- [x] 2025-09-16: Resolved TS2554 by making z.record schema explicit.
  - Updated: src/app/api/admin/service-requests/[id]/route.ts (z.record(z.string(), z.any()))
  - Updated: src/app/api/admin/service-requests/route.ts (z.record(z.string(), z.any()))
  - Updated: src/app/api/portal/service-requests/route.ts (z.record(z.string(), z.any()))
  - Notes: Aligns with zod v4 typings expecting 2 args in strict mode.
  - Updated: src/app/admin/page.tsx (replaced dashboardData.* with dashboard.* in BusinessIntelligence section)
  - Updated: src/app/admin/users/page.tsx (expanded updateUserRole type to include 'TEAM_MEMBER' and 'TEAM_LEAD')
  - Fixed: src/app/api/admin/permissions/[userId]/route.ts (removed duplicate NextResponse import)
  - Fixed: src/app/api/admin/team-members/[id]/route.ts (removed duplicate prisma import)
  - Fixed: src/app/api/admin/team-members/route.ts (resolved "Cannot redeclare block-scoped variable 'role'" by aliasing memberRole)
  - Fixed: src/app/api/{admin,portal}/service-requests/route.ts (cast JSON fields requirements/attachments to any to satisfy Prisma JSON typing)
  - Notes: Addresses TS2552, TS2451, TS2300, and TS2322 reported in Netlify logs; should allow build to proceed to Next.js compile.
- [x] 2025-09-16: Fixed Next.js 15 route handler signatures and a dashboard variable bug.
  - Updated: admin/permissions [userId] route to NextRequest with context.params Promise; multiple admin/portal service-requests [id] routes (assign, comments, status, tasks) similarly.
  - Fixed: duplicate NextResponse import in /api/admin/tasks/analytics; corrected undefined analyticsFallback/dashboard vars in admin/page.tsx.
  - Notes: Addresses Netlify TSC failures. Prisma client generation happens on Netlify prior to typecheck.
- [x] 2025-09-16: Fixed admin dashboard runtime crash when urgentTasks is undefined.
  - Updated: src/app/admin/page.tsx (default urgentTasks: [], null-safe uses for spread and length)
  - Notes: Prevents 'is not iterable' client error on first load.
- [x] 2025-09-16: Added route tests for admin and portal service-requests, and unit tests for permissions helpers.
  - Added: tests/admin-service-requests.route.test.ts, tests/portal-service-requests.route.test.ts, tests/permissions.test.ts
  - Notes: Prisma, auth, audit, realtime, and rate-limit mocked; responses validated against standardized { success, data, ... } shape.
- [x] 2025-09-16: Project paused; refreshed "Remaining work (paused)" checklist and updated status.
- [x] 2025-09-16: Replaced dashboard mock data with real APIs and added RBAC guards.
  - Updated: src/app/admin/page.tsx (removed mock fallbacks; uses /api/admin/stats/* and /api/admin/analytics)
  - Updated: src/app/api/admin/tasks/analytics/route.ts (RBAC + daily trends)
  - Updated: src/app/admin/tasks/components/analytics/TaskAnalytics.tsx (uses real trends)
  - Updated: src/app/api/admin/health-history/route.ts (RBAC + DB-backed buckets with fallback)
- [x] 2025-09-16: Switched task notifications endpoint to DB-backed with file fallback.
  - Updated: prisma/schema.prisma (added NotificationSettings model)
  - Updated: src/app/api/admin/tasks/notifications/route.ts (uses Prisma with fallback to file; RBAC preserved)
  - Notes: CI/CD will run prisma db push. Existing file-based settings remain as fallback when DB not configured.
- [x] 2025-09-16: Project paused; updated status and refreshed "Remaining work (paused)" checklist.
  - Notes: Env configured; awaiting CI/CD to run prisma tasks before resuming implementation.
- [x] 2025-09-16: Added unit tests for api-response and zodDetails.
  - Added: tests/api-response.test.ts
  - Notes: Verifies success/error shapes, status codes, meta fields, and zod flatten handling.
- [x] 2025-09-16: Extended standardization to remaining service-requests endpoints (admin/portal) and db-check.
  - Updated: src/app/api/admin/service-requests/[id]/{route,comments,assign,status,tasks}/route.ts
  - Updated: src/app/api/portal/service-requests/[id]/{route,comments}/route.ts
  - Updated: src/app/api/db-check/route.ts
  - Notes: All return { success, data | error } with consistent codes; zod details standardized.
- [x] 2025-09-16: Set Neon database env vars (NETLIFY_DATABASE_URL, DATABASE_URL) from provided credentials (value hidden).
  - Notes: CI/CD will run prisma generate/migrate/seed via netlify.toml.
- [x] 2025-09-16: Standardized API responses and validation for service-requests (admin/portal) list/create.
  - Added: src/lib/api-response.ts (respond helpers, zodDetails)
  - Updated: src/app/api/admin/service-requests/route.ts (GET/POST)
  - Updated: src/app/api/portal/service-requests/route.ts (GET/POST)
  - Notes: Consistent { success, data | error } shape; rate limit and auth use unified helpers.
- [x] 2025-09-16: Project paused; refreshed Remaining work (paused) with an actionable resume checklist.
  - Notes: Blocked on Prisma generate/migrate/seed due to environment ACL; to be run in CI/CD or dev shell.
- [x] 2025-09-16: Status updated to Active; resuming implementation.
- [x] 2025-09-16: Added client portal realtime SSE and wired UI auto-refresh.
  - Added: src/app/api/portal/realtime/route.ts
  - Updated: src/app/portal/service-requests/page.tsx (list auto-refresh)
  - Updated: src/app/portal/service-requests/[id]/page.tsx (detail auto-refresh)
  - Notes: Uses EventSource with exponential backoff; filters by user via realtimeService.
- [x] 2025-09-16: Targeted per-user realtime broadcasts for client portal.
  - Updated: src/app/api/admin/service-requests/route.ts (broadcast created to client)
  - Updated: src/app/api/admin/service-requests/[id]/route.ts (broadcast updated/deleted to client)
  - Updated: src/app/api/admin/service-requests/[id]/status/route.ts (broadcast status change to client)
  - Updated: src/app/api/admin/service-requests/[id]/assign/route.ts (broadcast assignment to client)
  - Updated: src/app/api/admin/service-requests/[id]/comments/route.ts (broadcast comment to client)
  - Updated: src/app/api/admin/service-requests/[id]/tasks/route.ts (broadcast task+SR updates to client)
  - Notes: Reduces noise by delivering only relevant events to the owning client.
- [x] 2025-09-16: Added rate limiting to client portal service-requests endpoints.
  - Updated: src/app/api/portal/service-requests/route.ts (POST)
  - Updated: src/app/api/portal/service-requests/[id]/route.ts (PATCH)
  - Updated: src/app/api/portal/service-requests/[id]/comments/route.ts (POST)
  - Notes: Uses getClientIp/rateLimit; protects from abuse; consistent with admin endpoints.
- [x] 2025-09-16: Consolidated app/lib duplicates into src/lib and fixed prisma imports.
  - Removed: src/app/lib/{auth.ts,email.ts,i18n.ts,prisma.ts,utils.ts}
  - Updated imports: use default import prisma from '@/lib/prisma' across admin service-requests endpoints and permissions routes; fixed lib auto-assignment.
  - Notes: Avoids ambiguous duplicates and runtime import mismatch.
- [x] 2025-09-16: Added rate limiting to mutation-heavy endpoints.
  - Added: getClientIp/rateLimit checks to POST/PUT/PATCH/DELETE handlers
  - Updated: /api/admin/service-requests (POST), [id]/assign (POST), [id]/status (PATCH), [id]/comments (POST), [id]/tasks (POST), bulk (POST), [id] (PATCH/DELETE)
  - Notes: Token-bucket in-memory limiter; safe for single instance; can swap to durable adapter later.
- [x] 2025-09-16: Added audit logging for key actions.
  - Updated: create/update/delete, assign, status, comment, task-create, bulk actions to call logAudit()
  - Notes: Persists to DB when available; logs to console otherwise. Visible in /admin/audits once surfaced.
- [x] 2025-09-16: Integrated task creation into Service Request detail page.
  - Updated: src/app/admin/service-requests/[id]/page.tsx (task list, create task via TaskForm, realtime refresh)
  - Uses: POST /api/admin/service-requests/[id]/tasks; maps critical->HIGH; dueDate->dueAt
  - Notes: Respects TASKS_CREATE permission; reloads on task-updated/service-request-updated events.
- [x] 2025-09-16: Added durable transport design and adapter foundation.
  - Added: docs/realtime-durable-transport.md (Redis vs Postgres design, rollout plan, envs)
  - Updated: src/lib/realtime-enhanced.ts (pub/sub adapter pattern; REALTIME_TRANSPORT flag)
  - Notes: Default remains in-memory; safe for single instance; multi-instance ready once adapter added.
- [x] 2025-09-16: Resumed project; implemented per-user realtime filtering and event subscriptions; wired broadcasts in APIs.
  - Updated: src/lib/realtime-enhanced.ts (filter by userId and event types; cleanup on disconnect)
  - Updated: src/app/api/admin/service-requests/route.ts (emit service-request-updated on create)
  - Updated: src/app/api/admin/service-requests/[id]/route.ts (emit on update and delete)
  - Updated: src/app/api/admin/service-requests/[id]/tasks/route.ts (emit task-updated and service-request-updated on task create)
  - Notes: Admin list/detail already subscribe via useRealtime; UI refreshes on events.
- [x] 2025-09-16: Re-paused project; refreshed "Remaining work (paused)" after Admin Service Requests UI shipped.
  - Notes: Focus next on DB migrations/seeds and realtime per-user filtering/durable transport.
- [x] 2025-09-16: Extended Admin Service Requests with edit page, assignment, and delete actions.
  - Added: src/app/admin/service-requests/[id]/edit/page.tsx
  - Updated: src/app/admin/service-requests/[id]/page.tsx (assignment UI, delete confirm, edit navigation)
  - Notes: Actions gated by permissions; list auto-refresh remains via realtime.
- [x] 2025-09-16: Added Service Requests KPIs and status chart to Admin Dashboard.
  - Updated: src/app/admin/page.tsx (ServiceRequestsSummary with KPIs + Pie chart from /api/admin/service-requests/analytics)
  - Notes: Reuses existing Card styles; integrates alongside TeamWorkloadSummary.
- [x] 2025-09-16: Added generic uploads API and wired portal UI.
  - Added: src/app/api/uploads/route.ts (multipart POST, validations, provider switch via UPLOADS_PROVIDER)
  - Updated: src/app/portal/service-requests/new/page.tsx (upload to /api/uploads, include URLs in attachments)
  - Updated: src/app/portal/service-requests/[id]/page.tsx (render attachment links and errors)
  - Notes: Storage provider not configured locally; set UPLOADS_PROVIDER and creds on deploy.
- [x] 2025-09-16: Configured Neon DB connection env vars.
  - Set: NETLIFY_DATABASE_URL and DATABASE_URL via dev server env
  - Blocker: prisma generate/db push/seed cannot run here due to ACL; will run during CI/CD or when shell access is enabled.
- [x] 2025-09-16: Implemented client portal attachments in create flow; display attachments in request detail.
  - Updated: src/app/portal/service-requests/new/page.tsx, src/app/portal/service-requests/[id]/page.tsx
  - Notes: Stores attachment metadata (name, size, type). Binary upload/storage pending strategy decision.
- [x] 2025-09-16: Project paused; updated status and clarified "Remaining work (paused)" checklist.
- [x] 2025-09-16: Role alignment completed across schema, seeds, and permissions usage.
  - Updated: prisma/schema.prisma (UserRole enum adds TEAM_MEMBER, TEAM_LEAD; kept STAFF for legacy), prisma/seed.ts (TEAM_MEMBER, added TEAM_LEAD user), src/lib/use-permissions.ts (map STAFF->TEAM_MEMBER for permission checks), src/app/api/bookings/[id]/confirm/route.ts (team roles allowed), src/app/admin/tasks/hooks/useTaskPermissions.tsx (TEAM_MEMBER/TEAM_LEAD support), src/app/admin/users/page.tsx (role filters/options/colors updated).
  - Notes: Legacy STAFF is still accepted/read; new users should use TEAM_MEMBER/TEAM_LEAD.
- [x] 2025-09-16: Prisma schema extended for service portal foundations.
  - Updated: prisma/schema.prisma (User: employeeId, department, position, skills, expertiseLevel, hourlyRate, availabilityStatus, maxConcurrentProjects, hireDate, manager relation; Service: basePrice, estimatedDurationHours, requiredSkills, status; added UserPermission model; added enums ExpertiseLevel, AvailabilityStatus, ServiceStatus, DefaultRole)
  - Notes: No DB migration run here. Run pnpm prisma generate and apply migrations when DB is connected.
- [x] 2025-09-16: Aligned middleware and navigation to new roles and updated permissions usage.
  - Updated: src/app/middleware.ts, src/components/ui/navigation.tsx, src/lib/use-permissions.ts, src/app/api/admin/service-requests/[id]/status/route.ts, src/app/types/next-auth.d.ts
  - Notes: Admin access now allowed for ADMIN, TEAM_LEAD, TEAM_MEMBER; API uses permissions.ts for status updates
- [x] 2025-09-16: Completed RBAC migration across remaining admin API routes to use permissions.ts consistently; removed legacy rbac checks and ADMIN/STAFF string guards.
  - Updated: src/app/api/admin/{activity,analytics,export,services,perf-metrics,system/health}.ts routes
  - Updated: src/app/api/admin/stats/{users,bookings,posts}/route.ts (use ANALYTICS_VIEW; users staff now = TEAM_MEMBER + TEAM_LEAD)
  - Updated: src/app/api/admin/currencies/{route,export,overrides,[code],refresh}.ts (mapped to ANALYTICS_VIEW/TEAM_MANAGE)
  - Updated: src/app/api/admin/bookings/route.ts (TEAM_MANAGE)
  - Updated: src/app/api/admin/users/route.ts (USERS_MANAGE)
  - Updated: src/app/api/admin/team-management/{workload,availability,skills,assignments}/route.ts (TEAM_VIEW/PATCH TEAM_MANAGE)
  - Updated: src/app/api/admin/team-members/[id]/route.ts now guarded (TEAM_VIEW/TEAM_MANAGE)
  - Updated: src/app/api/admin/permissions/{route.ts,roles/route.ts,[userId]/route.ts} (ANALYTICS_VIEW)
- [x] 2025-09-16: Project marked paused; refreshed Remaining work (paused) checklist to reflect current state.
- [x] 2025-09-16: Added default TaskTemplate seeds with new fields.
  - prisma/seed.ts: upserts three templates (onboarding, VAT return, quarterly audit)
  - Note: run seeds after connecting DB
- [x] 2025-09-16: Extended Prisma TaskTemplate model and aligned templates API.
  - prisma/schema.prisma: added fields to TaskTemplate + category index
  - /api/admin/tasks/templates: include/persist new fields (DB + file fallback)
  - Note: DB migration required; connect to database to run prisma migrate/generate
- [x] 2025-09-16: Enhanced task templates API (fallback) and dashboard integration.
  - Extended /api/admin/tasks/templates (file fallback) to support metadata: description, defaultPriority, defaultCategory, estimatedHours, checklistItems, category, requiredSkills, defaultAssigneeRole
  - Added Team Workload widget to /admin dashboard using /api/admin/team-management/workload
  - Kept DB path backward-compatible; meta fields will be enabled after Prisma schema update
- [x] 2025-09-16: Implemented admin team-management endpoints and template categories.
  - Added /api/admin/team-management/{availability,skills,workload,assignments}
  - Added /api/admin/tasks/templates/categories for category listing
  - Workload computes utilization with assumption of 3 concurrent capacity pending schema field
  - Availability includes active assignment counts from service requests
- [ ] YYYY-MM-DD: Created this TODO+log; no code changes yet. Next: start with Prisma schema updates.
- [ ] YYYY-MM-DD: Reviewed service_portal_implementation_guide.md and expanded TODO with multi-tenancy, permissions API, auto-assign, realtime wiring, client approval, rate limiting, and audit events.
- [x] 2025-09-15: Added permissions and realtime foundation.
  - Created src/lib/permissions.ts with PERMISSIONS and ROLE_PERMISSIONS (CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN) and helpers
  - Added src/components/PermissionGate.tsx for RBAC-based rendering
  - Implemented src/lib/realtime-enhanced.ts (emit/broadcast helpers)
  - Added SSE endpoint at src/app/api/admin/realtime/route.ts
  - Added client hook src/hooks/useRealtime.ts; retains last 100 events
- [x] 2025-09-15: Implemented permissions API endpoints.
  - Added src/app/api/admin/permissions/route.ts (GET roles, permissions)
  - Added src/app/api/admin/permissions/roles/route.ts (GET roles mapping)
  - Added src/app/api/admin/permissions/[userId]/route.ts (GET user permissions; supports 'me')
- [x] 2025-09-15: Extended Prisma schema for Service Requests.
  - Added enums RequestPriority and RequestStatus
  - Added models ServiceRequest and RequestTask with relations to User, Service, TeamMember, Task
  - Added indexes on clientId, status, priority, assignedTeamMemberId, deadline
- [x] 2025-09-15: Implemented core Service Requests API.
  - Added list/create, id get/patch/delete
  - Added status, assign, tasks, analytics, bulk, export endpoints
  - RBAC enforced via NextAuth role checks
- [x] 2025-09-15: Added auto-assignment utility.
  - Created src/lib/service-requests/assignment.ts and wired into POST create
- [x] 2025-09-15: Implemented Service Request comments.
  - Added prisma model ServiceRequestComment and relation on ServiceRequest
  - Added API: GET/POST /api/admin/service-requests/[id]/comments with attachments support and realtime broadcast

- [x] 2025-09-15: Implemented Client Portal service requests (APIs and pages).
  - Added API: /api/portal/service-requests (list/create), /api/portal/service-requests/[id] (GET/PATCH), /api/portal/service-requests/[id]/comments (GET/POST)
  - Added pages: src/app/portal/service-requests/{page.tsx,[id]/page.tsx,new/page.tsx}
  - Clients can create requests, view details, comment, approve, and cancel before progress

- [x] 2025-09-15: Implemented email notifications for service requests.
  - Assignment emails to client on team assignment
  - Status change emails to client on updates
  - Realtime events emitted for admin dashboards

- [x] 2025-09-15: Implemented in-app notifications for clients.
  - SSE-based notifications with bell icon in navigation
  - Shows assignment, status changes, and new comments
  - Mark-as-read and unread badge


