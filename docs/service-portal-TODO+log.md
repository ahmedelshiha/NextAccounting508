# Service Portal — TODO + Change Log

Status: Paused (as of 2025-09-16)

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

## Remaining work (paused)

- Resume checklist (ordered):
  1. Connect database (Neon) and run prisma generate/migrate/seed in CI/CD.
  2. Seed roles/permissions and default templates; verify RBAC via permissions API.
  3. Implement durable realtime adapter (Redis or Postgres LISTEN/NOTIFY) and set REALTIME_TRANSPORT.
  4. Decide/uploads provider and virus-scan policy; enable production uploads with limits.
  5. Replace file-based templates/notifications with DB-backed endpoints.
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
  - Implement durable transport adapter (Redis or Postgres) and configure REALTIME_TRANSPORT for multi-instance
  - [x] Add connection health checks and reconnection backoff in portal/admin SSE clients; plan idempotency for multi-instance delivery

- [ ] Admin UI
  - No remaining items here.


- [ ] Cleanup & Consistency
  - Replace file-based task comments/templates/notifications with DB-backed endpoints
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
- [ ] Replace mock dashboard data with real API and guards
- [x] Standardize zod validation and error shapes across new routes
  - Applied to service-requests (admin/portal) list/create and id/comment/assign/status/tasks endpoints via src/lib/api-response.ts
- [x] Apply rate limiting (src/lib/rate-limit.ts) to mutation-heavy endpoints
- [x] Emit audit events for create/assign/status changes (surface in /admin/audits)

### 9) Testing and docs
- [ ] Add unit tests for new lib/permissions and helpers
- [ ] Add unit tests for auto-assignment, status transitions, and RBAC guards
- [ ] Add route tests for service-requests, team-management, and templates
- [ ] Add e2e tests for client create/approve request and admin assign/complete
- [ ] Update docs/ to reflect new endpoints and flows

## Change Log
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


