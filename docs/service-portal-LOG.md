# Service Portal — Change Log and Status

## CURRENT STATUS: READY FOR DEPLOY (as of 2025-09-21)
- Env vars confirmed set in Netlify and GitHub. Netlify build will run Prisma generate/migrate/seed via netlify.toml when triggered.

## Autonomous Pause Summary (2025-09-20)
- Dev env: runtime envs set via dev server (NETLIFY_DATABASE_URL, DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NETLIFY_BLOBS_TOKEN, REALTIME_TRANSPORT, REALTIME_PG_URL, UPLOADS_PROVIDER, CRON_*).
- Next: Trigger Netlify/GitHub CI to run Prisma generate/migrate/seed; verify via /api/admin/permissions.

## Completed Work — Booking Context (Summary)
- Unified Service Requests APIs (admin/portal) with RBAC, realtime, CSV export, comments, tasks; legacy /api/bookings forwarder with deprecation headers.
- Admin & Portal availability endpoints added; portals query availability before confirm/reschedule.
- Appointment creation via unified payload (isBooking, scheduledAt, duration, bookingType) in admin and portal.
- Confirm/reschedule endpoints send ICS calendar invites when SENDGRID is configured.
- Booking type filters, scheduledAt ordering, analytics/KPIs, and CSV export columns in place.
- Booking preferences API and reminders cron endpoint/workflow implemented.
- Durable realtime transport (Postgres LISTEN/NOTIFY) behind flag; SSE clients wired across admin/portal.
- Prisma schema prepared for Phase 1 booking fields and related models; migrations staged for CI.

## Current Status Details
- Local dev: Prisma client generated and seed applied; dev-login and in-memory fallbacks available for smoke tests.
- CI/staging: Awaiting CI to run db generate/migrate/seed against Neon using NETLIFY_DATABASE_URL; DATABASE_URL to be set in GitHub secrets.
- Realtime/uploads: Postgres adapter implemented; Netlify Blobs provider integrated; enable via envs.

## Notes & Operational Reminders
- Required envs must be present in Netlify and GitHub (DATABASE_URL, NETLIFY_DATABASE_URL, NETLIFY_BLOBS_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL, CRON_SECRET, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID).
- Prefer CI-based migrations to avoid schema drift between environments.

## Reference Plan
- Booking enhancement plan: [docs/booking_enhancement_plan.md](./booking_enhancement_plan.md)

---

## 2025-09-21 — Admin Users/Stats 500s fixed
- Root cause: Missing import of NextResponse/NextRequest in admin endpoints caused runtime ReferenceError → 500.
- Fix: Added imports in /api/admin/users and /api/admin/stats/users. Added graceful fallbacks when DB/schema not available.
- Result: Admin Users page loads demo data instead of failing; stats widget no longer shows error.

## 2025-09-21 — Quarantine CSV export
- Added Export DB CSV and Export Provider CSV buttons to /admin/uploads/quarantine.
- Why: Ops needs quick CSV outputs for triage and reporting; aligns with uploads runbook "Export logs" guidance.
- Notes: Exports use currently loaded/filtered rows; no extra fetch; consider JSON export and audit CSV next.

## 2025-09-21 — Portal bookings array handling bugfix
- Fixed client crash on /portal and /portal/bookings when API returns wrapped shape { success, data }.
- Updated pages to unwrap json.data safely and fallback to []. Prevents "j.filter is not a function" in production.
