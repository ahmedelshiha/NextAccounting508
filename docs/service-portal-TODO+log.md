# Service Portal — TODO + Change Log

Status: Paused (as of 2025-09-15)

This file tracks the full implementation plan derived from:
- docs/service_portal_implementation_guide.md
- docs/website-audit.md
- docs/admin-dashboard-audit.md

All tasks are unchecked until implemented. Update this log after each change with date, files, and brief notes.

## Remaining work (paused)
- Prisma: extend User and Service models; add UserPermission model; finalize attachments strategy; plan multi-tenancy; run migrations and seeds
- APIs: implement team-management (availability, skills, workload, assignments) and task-templates CRUD with categories; finalize enhanced middleware/roles alignment
- Realtime: per-user event filtering and durable transport plan
- Admin UI: integrate KPIs into admin dashboard; build Service Requests pages/components with realtime and permission-gated actions
- Client Portal: list/detail/create service requests, client approvals, notifications
- Cleanup: consolidate src/app/lib duplicates; migrate file-based task data to DB; replace mock dashboard data; add rate limiting and audit events
- Testing/Docs: unit tests (auto-assign, RBAC), route tests, e2e for client/admin flows; docs updates

## TODO (unchecked)

### 1) Database and Prisma schema
- [x] Add models ServiceRequest and RequestTask with enums RequestPriority, RequestStatus (prisma/schema.prisma)
- [ ] Extend prisma/schema.prisma with remaining models/fields: TaskTemplate extensions, TaskComment (service-requests), UserPermission; enums ExpertiseLevel, AvailabilityStatus, ServiceStatus, DefaultRole
- [ ] Add fields to User and Service models per guide (employeeId, department, position, skills, expertiseLevel, hourlyRate, availabilityStatus, maxConcurrentProjects, hireDate, manager relation; Service.requiredSkills/status)
- [ ] Plan multi-tenancy: introduce tenantId/orgId on relevant tables (users, services, service_requests, tasks) with indexes; scope queries behind feature flag
- [ ] Define attachments storage strategy (provider, size limits, virus scan) and persist attachment metadata schema
- [x] Add DB indexes as in guide (status, priority, assigned_team_member_id, deadline, client_id)
- [ ] Generate and verify Prisma client (pnpm prisma generate)
- [ ] Create migration for new tables/columns and run locally (db push or migrate)
- [ ] Seed minimal data for templates/permissions and default roles (CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN)

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
- [ ] Create src/app/api/admin/team-management/{availability,skills,workload,assignments}/route.ts
- [ ] Compute utilization and workload using maxConcurrentProjects; include active assignments detail
- [ ] Create src/app/api/admin/task-templates/{route.ts,[id]/route.ts,categories/route.ts}
- [ ] Seed and manage template categories; filter by requiredSkills when creating from template

### 4) Permissions and Middleware
- [x] Add src/lib/permissions.ts (PERMISSIONS, ROLE_PERMISSIONS, helpers)
- [x] Implement permissions API: src/app/api/admin/permissions/{route.ts,[userId]/route.ts,roles/route.ts}
- [ ] Align roles to CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN; update seeds and use-permissions hook
- [ ] Wire enhanced checks inside src/app/middleware.ts for /admin and /portal service routes
- [x] Add PermissionGate component (src/components/PermissionGate.tsx) and use in admin UIs (tables, action buttons)

### 5) Real-time
- [x] Add enhanced realtime service src/lib/realtime-enhanced.ts
- [x] Add SSE endpoint src/app/api/admin/realtime/route.ts
- [x] Create client hook src/hooks/useRealtime.ts and test basic events
- [ ] Broadcast events: service-request-updated, task-updated, team-assignment; subscribe in admin pages
- [ ] Implement per-user event filtering and clean shutdowns; plan durable transport for multi-instance

### 6) Admin UI: Dashboard and Pages
- [ ] Update src/app/admin/page.tsx to render service request KPIs and charts (calls new analytics/workload endpoints)
- [ ] Add admin pages: src/app/admin/service-requests/{page.tsx,[id]/page.tsx,edit/page.tsx,new/page.tsx}
- [ ] Build components: components/admin/service-requests/{table.tsx,filters.tsx,bulk-actions.tsx,overview.tsx,team-workload-chart.tsx,request-status-distribution.tsx}
- [ ] Wire realtime updates on service-requests page using useRealtime
- [ ] Permission-gate actions (assign, delete, export) and show disabled tooltips when lacking rights
- [ ] Integrate ServiceRequestTaskCreator into admin/task flows where relevant

### 7) Client Portal
- [ ] Add portal listings: src/app/portal/service-requests/page.tsx (client-only list)
- [ ] Add detail: src/app/portal/service-requests/[id]/page.tsx with comment thread and status
- [ ] Add create flow: src/app/portal/service-requests/new/page.tsx (client creates requests with attachments)
- [ ] Add client approval action and status view (sets clientApprovalAt)
- [ ] Notify client on assignment/status updates (email + in-app)

### 8) Cleanup and Consistency (from audits)
- [ ] Remove or consolidate src/app/lib/* duplicates into src/lib/* and fix imports
- [ ] Replace file-based task comments/templates/notifications with DB-backed endpoints
- [ ] Replace mock dashboard data with real API and guards
- [ ] Standardize zod validation and error shapes across new routes
- [ ] Apply rate limiting (src/lib/rate-limit.ts) to mutation-heavy endpoints
- [ ] Emit audit events for create/assign/status changes (surface in /admin/audits)

### 9) Testing and docs
- [ ] Add unit tests for new lib/permissions and helpers
- [ ] Add unit tests for auto-assignment, status transitions, and RBAC guards
- [ ] Add route tests for service-requests, team-management, and templates
- [ ] Add e2e tests for client create/approve request and admin assign/complete
- [ ] Update docs/ to reflect new endpoints and flows

## Change Log
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
