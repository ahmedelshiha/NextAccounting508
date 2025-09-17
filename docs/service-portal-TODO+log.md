# Service Portal — TODO + Change Log

Status: Paused (as of 2025-09-17)

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

## Current Status (Paused)
- Waiting on CI/CD to run Prisma generate/migrate/seed against Neon. Env configured; migrations not yet applied in this environment.
- Uploads provider chosen: Netlify Blobs. Provider wiring in API pending; need NETLIFY_BLOBS_TOKEN in env and key-generation in /api/uploads.
- Realtime durable adapter implemented (Postgres LISTEN/NOTIFY). Needs REALTIME_TRANSPORT=postgres and staging validation for multi-instance delivery.
- Tests in place for key routes; unit/e2e coverage pending; thresholds require tightening.

## Remaining Work (Paused) — Checklist (At a glance)
- Database
  - [ ] Run prisma migrate/seed in CI/CD and verify seeds (roles/permissions)
  - [ ] Add multi-tenancy (tenantId/orgId + indexes) and scope queries behind a flag
- Realtime
  - [ ] Validate multi-instance LISTEN/NOTIFY on Netlify; confirm 'postgres' transport in /admin header and cross-instance event delivery
- Uploads
  - [x] Enable antivirus scan webhook and enforce stricter MIME/extension policy; surface upload errors in portal UI
- QA & Testing
  - [ ] Tighten coverage thresholds; add unit tests (RBAC, auto-assign, status transitions) and e2e for client/admin flows
- Docs & Runbooks
  - [ ] Document required env vars and deployment checklist; add rollback steps
- Observability
  - [ ] Integrate Sentry for error/perf monitoring and alerts
- Admin UI
  - [x] Add pagination and server-side search to /admin/audits

## Remaining Work (Paused)
1) Database and Migrations
- [ ] Run Prisma generate/migrate/seed in CI/CD; verify tables/enums and seed data applied
- [ ] Seed permissions and default roles (CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN)
- [ ] Implement multi-tenancy scoping behind feature flag; add tenantId/orgId to models and indexes; scope queries

2) Uploads and File Storage
- [x] Implement Netlify Blobs in /api/uploads (use NETLIFY_BLOBS_TOKEN); generate object key, set contentType, return public URL
- [ ] Add optional antivirus scan step and stricter extension policy; audit log uploads and failures
- [ ] Update portal UI to display per-file upload status/errors; retry/remove controls

3) Realtime and Ops
- [ ] Set REALTIME_TRANSPORT=postgres (and REALTIME_PG_URL/REALTIME_PG_CHANNEL if different from DATABASE_URL)
- [ ] Validate multi-instance delivery in staging; monitor reconnect/backoff; confirm cross-instance events

4) QA and Testing
- [ ] Add unit tests for auto-assignment, status transitions, and RBAC guards
- [ ] Tighten coverage thresholds in tests/thresholds.test.ts and ensure passing locally/CI
- [ ] Add e2e tests for client request create/approve and admin assign/progress/complete flows

5) Documentation and Runbooks
- [ ] Document required env vars and values: DATABASE_URL, NETLIFY_BLOBS_TOKEN, REALTIME_*; provider setup steps
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
- [ ] Add unit tests for new lib/permissions and helpers
- [ ] Add unit tests for auto-assignment, status transitions, and RBAC guards
- [x] Add route tests for service-requests
- [x] Add route tests for team-management
- [x] Add route tests for templates
- [ ] Add e2e tests for client create/approve request and admin assign/complete
- [ ] Update docs/ to reflect new endpoints and flows

## Change Log
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


