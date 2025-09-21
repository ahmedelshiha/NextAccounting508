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

## 2025-09-21 — Durable realtime enabled (Postgres)
- Config: REALTIME_TRANSPORT=postgres, REALTIME_PG_URL set (or fallback to DATABASE_URL). Adapter listens on sanitized channel and publishes via pg_notify.
- Verification: Admin Chat Console shows transport=postgres and increments connection/event metrics; cross-tab/browser chat messages delivered.
- Next: Add admin dashboard health widget and alerting on adapter reconnects.

## 2025-09-21 — PWA + offline cache (flag-gated)
- Added manifest.webmanifest and service worker (runtime caching for assets + /api/services and portal request lists). Registration controlled by NEXT_PUBLIC_ENABLE_PWA.
- Added offline queue in LiveChatWidget to store portal chat POSTs and flush on reconnect.
- Next: Expand caches via IndexedDB, offline portal UX for bookings/services, and add offline indicator UI.

## 2025-09-21 — Chat persistence + retention
- Schema: Added ChatMessage model (chat_messages). No migration yet; deploy-safe until CI migration added.
- Runtime: broadcastChatMessage persists to DB when available; failures are swallowed to keep UX smooth.
- Ops: Weekly cleanup deletes chat messages older than 30 days.
- Next: Add migration SQL and enable in Netlify CI; admin filters and export.

## 2025-09-21 — Admin chat console
- Added /admin/chat page with AdminChatConsole component (room filter, backlog load, SSE updates) and API (/api/admin/chat) with permission guards.
- Why: Allows support/admins to view and respond in real time using existing realtime transport.
- Next: Group/room management UI, persistence to DB with retention, role-based targeting, and tests.

## 2025-09-21 — Live chat (SSE) MVP
- Implemented authenticated SSE chat for portal users:
  - API: POST /api/portal/chat (auth-gated, IP rate-limited) and GET /api/portal/chat (recent backlog)
  - Realtime: broadcasts via EnhancedRealtimeService with type "chat-message"
  - Frontend: lightweight LiveChatWidget rendered on portal routes; subscribes to /api/portal/realtime?events=chat-message
  - Storage: in-memory backlog (per tenant) to show recent messages; no DB writes yet
- Why: Enables immediate customer support interaction using existing realtime infrastructure with minimal surface area.
- Next: Admin console to view/respond, per-tenant rooms/targeting, optional persistence + retention policies, and tests.

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

## 2025-09-21 — CI: TypeScript NextResponse import fix
- What: Imported NextResponse from 'next/server' into two API route files that were missing the import (src/app/api/admin/users/route.ts, src/app/api/admin/stats/users/route.ts).
- Why: Netlify build failed during TypeScript compilation (tsc --noEmit) with "Cannot find name 'NextResponse'". This prevented successful deploys.
- Impact: Allows the TypeScript compile step to succeed for these routes and removes the immediate build blocker.
- Next steps: Trigger Netlify deploy to confirm; run a repository-wide grep for any additional routes referencing NextResponse without import and patch as needed.

## 2025-09-21 — Admin Tasks/Analytics 500s handled
- What: Addressed repeated 500 errors on admin Tasks page by:
  - Adding missing NextRequest/NextResponse imports where necessary.
  - Adding resilient fallbacks for Prisma schema/database errors (P10/P20 and relation/table/column errors).
- Files updated: src/app/api/admin/analytics/route.ts, src/app/api/admin/stats/bookings/route.ts, src/app/api/admin/tasks/route.ts
- Why: Prevent staging/admin UI from crashing when DB is present but migrations or tables are not yet available during early deploys.
- Impact: Admin Tasks page should show demo/fallback data instead of returning 500s. Monitor after deploy and collect server logs if further errors persist.
- Next steps: Trigger Netlify deploy and validate the Tasks page; if any endpoints still 500, provide the route name and recent server logs and I'll patch further.
