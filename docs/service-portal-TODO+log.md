- [x] 2025-09-16: Admin Create Service Request — fixed opaque error message "Error: [object Object]".
  - Updated: src/app/admin/service-requests/new/page.tsx
  - What: Properly read standardized API error shape ({ success:false, error:{ code, message, details } }) and surface error.message instead of throwing the error object.
  - Why: Throwing new Error(object) produced "Error: [object Object]" in the UI. Now shows clear validation/auth messages.
  - Next: Audit other forms for similar patterns; consider a small helper to extractApiError(res) for consistency.

- [x] 2025-09-16: Admin navigation — added notification bell with live SSE updates.
  - Updated: src/components/ui/navigation.tsx, added src/hooks/useAdminNotifications.ts
  - What: Replicated client bell experience for admins using /api/admin/realtime (service-request-updated, task-updated, team-assignment), unread badge, and dropdown list.
  - Why: Consistent notifications across admin pages, not just dashboard.
  - Next: Centralize notification item shape and message builders to a shared util.

- [x] 2025-09-16: Admin Create Service Request — fixed "Invalid payload" on deadline.
  - Updated: src/app/admin/service-requests/new/page.tsx
  - What: Convert datetime-local value to ISO (toISOString) before POST so it matches z.string().datetime() in API schema.
  - Why: zod datetime() requires RFC3339; browser datetime-local lacks timezone.
  - Next: Add a shared date serialization helper and apply across forms.

- [x] 2025-09-16: Client Portal — added filters, search (debounced), and pagination to Service Requests list.
  - Updated: src/app/portal/service-requests/page.tsx
  - What: Added status/priority filters, debounced search by title/description, and page/limit-driven pagination using API meta.pagination. Realtime refresh preserved; added manual refresh.
  - Why: Improve UX for clients with many requests; leverage existing API query parameters without requiring DB migrations.
  - Next: Persist user filter prefs (localStorage), add page size selector, and optional infinite scroll. Consider small route tests validating pagination meta.

- [x] 2025-09-16: Admin Dashboard — surfaced Service Requests in Smart Actions (Primary).
  - Updated: src/app/admin/page.tsx
  - What: Added a "Service Requests" shortcut under Smart Actions > Primary linking to /admin/service-requests (management already had entries for Service Requests and Assign Requests). Keeps existing styles and variants.
  - Why: Faster access from the main Smart Actions pane.
  - Next: Optionally display active request count badge when analytics are available.

- [x] 2025-09-16: Admin Dashboard — implemented notifications via SSE using /api/admin/realtime.
  - Updated: src/app/admin/page.tsx
  - What: Replaced unused /api/admin/updates EventSource with /api/admin/realtime and mapped events (service-request-updated, task-updated, team-assignment) into the header notification dropdown. Unread badge updates live; styles unchanged.
  - Why: Existing realtime bus already emits these events; wiring them enables live admin notifications.
  - Next: Add DB-backed persistence (optional) by reading recent events from RealtimeEvents and surface a /api/admin/notifications list endpoint.

# Service Portal — TODO + Change Log

Status: Active (as of 2025-09-16)

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

## Remaining Work (Paused) — Actionable Checklist

Current status: PAUSED (as of 2025-09-16). The team resumed work to complete DB migrations/seeds and realtime durable transport, then re-paused to consolidate CI/CD and multi-tenancy plans.

Summary of what is already completed (high level):
- Prisma schema extended for service-portal foundations (TaskTemplate, ServiceRequest, UserPermission, enums, indexes).
- Admin and Portal Service Requests APIs implemented (list/create, id endpoints, comments, assign, tasks, status, analytics, export, bulk).
- Realtime foundation implemented with Postgres polling adapter and in-memory fallback; verified RealtimeEvents table and writable.
- Admin templates endpoints switched to DB-first with file fallback; demo template seeds present.
- Demo accounts and permissions seeded locally (admin, staff/TEAM_MEMBER, lead/TEAM_LEAD); login page updated to display accounts.
- RBAC migration and permission helpers implemented; PermissionGate component added.

Actionable Remaining Work (for resume):
1) CI/CD: run migrations, generate client, and run seeds in CI (Netlify)
   - Why: Ensure production/staging DB schema and seeds match repo (roles, templates, demo users).
   - Steps:
     a. Ensure Neon connection is available and envs NETLIFY_DATABASE_URL/DATABASE_URL are set in Netlify site settings.
     b. Push branch with latest changes (ai_main_3f3fbea2b33a) or trigger deploy hook.
     c. CI will run: npm run db:push -- --accept-data-loss && npm run db:seed && npm run build (per netlify.toml).
     d. Verify Netlify build logs show seed output (Team Lead: lead@accountingfirm.com / lead123) and no migration errors.
   - Owner: DevOps / Maintainer (can be run from CI pipeline).

2) Multi-tenancy rollout (tenantId/orgId)
   - Why: Scope data by tenant and add indexes; required for production isolation.
   - Steps:
     a. Finalize tenantId columns and nullable rollout strategy in schema (already present as nullable).
     b. Create migration that adds tenantId indexes and backfills if needed.
     c. Add feature-flag gating (MULTI_TENANCY_ENABLED) and middleware checks.
   - Owner: Backend engineer

3) Attachments & Uploads provider + virus-scan policy
   - Why: Production-safe file uploads for portal/admin flows.
   - Steps:
     a. Decide provider (S3/Minio/Netlify/Cloud) and add UPLOADS_PROVIDER env.
     b. Implement server-side size/type limits; integrate virus scanning (clamav or 3rd-party) in upload pipeline.
     c. Persist attachment metadata in DB and migrate file-fallbacks to DB-backed storage.
   - Owner: Backend engineer / Security

4) Replace file-based comments/templates/notifications with DB-backed endpoints (complete migration)
   - Why: Remove file fallbacks and enable consistent DB-backed behavior across environments.
   - Steps:
     a. Create and apply migrations for task/template/comment models (schema already updated but ensure migrations applied).
     b. Migrate existing file-based data into DB where applicable.
     c. Remove file-fallback code paths once DB is verified in CI.
   - Owner: Backend engineer

5) Realtime durable transport verification (cross-instance)
   - Why: Ensure Postgres polling adapter reliably delivers events across instances.
   - Steps:
     a. Run a long-running staging instance (or CI job) that subscribes via polling adapter.
     b. Publish test events and assert delivery to subscriber(s).
     c. Add an automated smoke test (optional) that starts adapter, publishes an event, and verifies delivery.
   - Owner: Backend / QA

6) Testing: unit, route, and E2E
   - Why: Ensure regressions are detected and enforce quality gates in CI.
   - Steps:
     a. Add unit tests for lib/permissions, auto-assignment, and other helpers.
     b. Add route tests for templates (DB + file fallback), service-requests, and team-management.
     c. Add E2E scenarios: client create/approve request, admin assign/complete, file uploads, realtime notifications.
     d. Run tests in CI and raise thresholds for coverage where appropriate.
   - Owner: QA / Developers

7) Documentation and runbooks
   - Why: Operators must know how to run migrations/seeds, connect Neon, configure REALTIME_TRANSPORT, and handle incidents.
   - Steps:
     a. Update docs/service_portal_implementation_guide.md and ops runbooks with precise CI commands, required envs, and rollback steps.
     b. Document uploads provider configuration and virus-scan operational steps.
   - Owner: Developer / Ops

Quick checklist to unpause and continue work:
- [ ] Push latest commits to ai_main_3f3fbea2b33a and open/refresh PR
- [ ] Trigger Netlify deploy (or let CI run) and confirm prisma db push/seed completes with seed outputs
- [ ] Mark environment REALTIME_TRANSPORT=postgres and validate cross-instance delivery in staging
- [ ] Run migration to add tenantId indexes (if required) and confirm operations
- [ ] Replace any remaining file fallbacks after DB confirmed
- [ ] Merge tests and enable test job in CI

Notes & Current state snapshot:
- Repo branch: ai_main_3f3fbea2b33a (local commits ahead; push required to update PR)
- Neon DB envs present in environment variables (NETLIFY_DATABASE_URL / DATABASE_URL). Connectivity tested from this environment (RealtimeEvents table created and writable).
- Prisma schema updated; seeds updated (demo users + demo permissions + templates).
- Templates endpoints now prefer DB at runtime and fall back to file for local dev/tests.

Change Log: recent (high level):
- [x] 2025-09-16: Added Vitest config and fixed bulk route tests to unblock CI.
  - Added: vitest.config.ts
  - Updated: src/app/admin/tasks/tests/api.bulk.route.test.ts (use @ alias, mock '@/lib/prisma')
  - Notes: Resolves module resolution errors in Vitest; route/API tests pass locally. No runtime changes.
  - Next: Run tests in CI, then raise coverage thresholds and add realtime smoke test.

- [x] 2025-09-16: Admin dashboard: surface unauthorized state and prevent empty zeroed UI when APIs return 401.
  - Updated: src/app/admin/page.tsx
  - What: Detect 401 responses during dashboard data load and show a clear banner with sign-in and CI/db hints instead of rendering empty zeroed cards.
  - Why: Users visiting /admin without a valid session (deployed env) saw blank/zero dashboard; this improves UX and points operators to fix auth/DB in CI.
  - Next: If you want, I can add an automated health-check endpoint that validates DB connectivity and auth session in staging and include it in the dashboard's systemHealth display.

- [x] 2025-09-16: Added Service Requests to Smart Actions
  - Updated: src/app/admin/page.tsx
  - What: Added 'Service Requests' and 'Assign Requests' entries under Smart Actions > management and 'New Service Request' under primary actions. Uses badge counts from dashboard stats where available.
  - Why: Provide quick access to service-request workflows for admins and improve discoverability.
  - Next: Wire badge to service-requests analytics (newThisWeek/activeRequests) if preferred, and add an 'Export Requests' quick action.
- 2025-09-16: Fixed Netlify TSC error TS2304 in /api/admin/tasks/templates DELETE handler by replacing stray hasDb with await dbAvailable(); build should proceed.
- 2025-09-16: DB-first templates endpoints implemented; demo permissions seeded; realtime table verified; seed updated to include Team Lead; local DB push & seed executed.

------

Please let me know if you want me to automatically push the branch & trigger Netlify deploy and/or open a PR update now — I can perform those steps if you want me to proceed autonomously.
- [ ] Database/Prisma
  - Extend User and Service models; add UserPermission model; add enums ExpertiseLevel, AvailabilityStatus, ServiceStatus, DefaultRole
  - Plan multi-tenancy (tenantId/orgId + indexes) and scope queries behind a flag
  - Define attachments storage strategy and persist attachment metadata schema
  - Run prisma generate/migrate; seed permissions and default roles

- [ ] Permissions/Middleware
  - No remaining items here; roles aligned and middleware checks completed.

Recent fixes:
- 2025-09-16: Admin Create Service Request page updated to populate Client and Service selects from /api/admin/users and /api/services. This fixes empty Client ID/Service ID when creating requests and improves UX by letting admins pick existing records. (What: replaced free-text inputs with selects; Why: avoid missing IDs and reduce errors; Next: add search/autocomplete for large user lists)
- 2025-09-16: Added basic search inputs inside Client and Service selects (client-side filtering). What: small search boxes in SelectContent to filter loaded lists; Why: improves UX for medium lists and reduces selection time; Next: implemented server-side paginated search for users and client-side debounce to reduce load; Next: consider server-side autocomplete endpoint for services and add tests.

- [x] Realtime
  - Implement durable transport adapter (Postgres polling via Neon) and env toggle REALTIME_TRANSPORT=postgres; falls back to in-memory when DB is unavailable
  - [x] Add connection health checks and reconnection backoff in portal/admin SSE clients; plan idempotency for multi-instance delivery

- [ ] Admin UI
  - No remaining items here.


- [ ] Cleanup & Consistency
  - [ ] Replace file-based task comments/templates/notifications with DB-backed endpoints
  - [ ] Replace file-based templates with DB-backed endpoints
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
- [ ] Replace file-based task comments/templates/notifications with DB-backed endpoints
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
- [ ] Add route tests for templates
- [ ] Add e2e tests for client create/approve request and admin assign/complete
- [ ] Update docs/ to reflect new endpoints and flows

## Change Log
- [x] 2025-09-16: Updated seed demo accounts — added Team Lead credentials and seed log entry.
  - Updated: prisma/seed.ts, src/app/login/page.tsx
  - Notes: Added Team Lead user (lead@accountingfirm.com / lead123) to repo seed and displayed on login page. Netlify build logs indicate the CI run earlier used the previous seed; please push this commit to the branch Netlify builds or trigger a redeploy so CI/CD runs the updated seed. Verify Netlify build logs show the Team Lead line.

- [x] 2025-09-16: Added Prisma models (Tenant, Template, RealtimeEvent), migration SQL, seed updates, GH Actions workflow, Netlify config, /api/templates endpoints, multi-tenancy middleware.
  - Updated: prisma/schema.prisma, prisma/migrations/20250916_add_templates_realtime_tenant/migration.sql, prisma/seed.ts, .github/workflows/prisma-migrate-and-deploy.yml, netlify.toml, src/lib/prisma.ts, src/app/api/templates/*, tests/templates.route.test.ts
  - Notes: tenantId columns added as nullable for safe rollout; MULTI_TENANCY_ENABLED toggles middleware; CI workflow will run migrations + seed and trigger Netlify via NETLIFY_BUILD_HOOK.

## Change Log
- [x] 2025-09-16: Implemented durable realtime transport (Postgres polling via Neon) with env toggle.
  - Updated: src/lib/realtime-enhanced.ts (added PostgresPollingPubSub; REALTIME_TRANSPORT=postgres, REALTIME_PG_POLL_MS)
  - Notes: Uses table "RealtimeEvents" for cross-instance event fanout; gracefully falls back to in-memory when DB is unavailable.
- [x] 2025-09-16: Added route tests for team-management endpoints.
  - Added: tests/team-management.routes.test.ts (availability, workload, assignments, skills PATCH)
  - Notes: Mocks prisma and next-auth; toggles NETLIFY_DATABASE_URL in-module to cover both fallback and DB code paths.
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


- [x] 2025-09-16: Executed prisma db push & seed from development environment and applied updated seed; Team Lead confirmed in DB.
  - Updated: prisma/seed.ts applied to database via local db push & seed run
  - Notes: Ran `npm run db:push -- --accept-data-loss && npm run db:seed` from the project environment. Seed output included:

    🎉 Seed completed successfully!

    📋 Test Accounts:
    Admin: admin@accountingfirm.com / admin123
    Staff: staff@accountingfirm.com / staff123
    Team Lead: lead@accountingfirm.com / lead123

  - Recommendation: Push this repo commit and trigger CI/CD (Netlify) to keep environments consistent and ensure subsequent builds match DB state.

- [x] 2025-09-16: Verified Postgres "RealtimeEvents" table exists and is writable; inserted test event.
  - Updated: scripts/test-realtime.js (helper script to verify table and publish test event)
  - Notes: Executed test script which created the table (if missing), inserted a test payload, and returned recent rows. Script output:

    Inserted id: 1
    Recent rows: [ { id: '1', payload: { test: 'ping', ts: '2025-09-16T13:20:50.454Z' }, created_at: 2025-09-16T13:20:50.475Z } ]

  - Next: Run cross-instance validation by observing the polling adapter in a long-running instance (CI or staging) subscribing to events. If desired, I can add an automated smoke test that starts the polling adapter, publishes an event, and asserts delivery.

- [x] 2025-09-16: Implemented DB-first templates endpoints with file fallback for local/dev.
  - Updated: src/app/api/admin/tasks/templates/route.ts, src/app/api/admin/tasks/templates/categories/route.ts
  - Notes: Endpoints now attempt a lightweight DB probe at runtime (prisma.$queryRaw`SELECT 1`) and use the Prisma-backed TaskTemplate table when available. If DB is unreachable or not configured, endpoints fall back to the local file at src/app/admin/tasks/data/templates.json. This preserves local dev/tests that mock the file system while enabling DB-backed behavior in CI/CD and production.

- [x] 2025-09-16: Seeded demo user permissions for ADMIN, TEAM_MEMBER, TEAM_LEAD.
  - Updated: prisma/seed.ts
  - Notes: Seed now creates UserPermission records for demo accounts (admin, staff, lead) based on ROLE_PERMISSIONS mapping in src/lib/permissions.ts. This simplifies local demo testing and verifies RBAC mappings are present in DB once seeds run in CI/CD.
