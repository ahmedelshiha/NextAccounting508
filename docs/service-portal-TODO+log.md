# Service Portal — TODO + Change Log

This file tracks the full implementation plan derived from:
- docs/service_portal_implementation_guide.md
- docs/website-audit.md
- docs/admin-dashboard-audit.md

All tasks are unchecked until implemented. Update this log after each change with date, files, and brief notes.

## TODO (unchecked)

### 1) Database and Prisma schema
- [ ] Extend prisma/schema.prisma with models/enums: ServiceRequest, RequestTask, TaskTemplate, TaskComment, UserPermission; enums ExpertiseLevel, AvailabilityStatus, ServiceStatus, Priority, RequestStatus, DefaultRole
- [ ] Add fields to User and Service models per guide (employeeId, department, position, skills, expertiseLevel, hourlyRate, availabilityStatus, maxConcurrentProjects, hireDate, manager relation; Service.category, basePrice, estimatedDurationHours, requiredSkills, status)
- [ ] Generate and verify Prisma client (pnpm prisma generate)
- [ ] Create migration for new tables/columns and run locally (db push or migrate)
- [ ] Seed minimal data for templates/permissions if needed (prisma/seed.ts)

### 2) Admin API: Service Requests
- [ ] Create folder structure src/app/api/admin/service-requests/
- [ ] Implement route.ts (GET list w/ filters, POST create w/ zod validation)
- [ ] Implement [id]/route.ts (GET, PATCH, DELETE)
- [ ] Implement [id]/assign/route.ts (POST assign to team member + audit)
- [ ] Implement [id]/tasks/route.ts (GET related tasks, POST create from template/plain)
- [ ] Implement [id]/comments/route.ts (GET/POST comments)
- [ ] Implement [id]/status/route.ts (PATCH status transitions)
- [ ] Implement bulk/route.ts (bulk operations)
- [ ] Implement export/route.ts (CSV export)
- [ ] Implement analytics/route.ts (aggregates for dashboard)

### 3) Admin API: Team Management and Templates
- [ ] Create src/app/api/admin/team-management/{availability,skills,workload,assignments}/route.ts
- [ ] Create src/app/api/admin/task-templates/{route.ts,[id]/route.ts,categories/route.ts}

### 4) Permissions and Middleware
- [ ] Add src/lib/permissions.ts (PERMISSIONS, ROLE_PERMISSIONS, helpers)
- [ ] Wire enhanced checks inside src/app/middleware.ts for /admin and /portal service routes
- [ ] Add PermissionGate component (src/components/PermissionGate.tsx) and use in admin UIs

### 5) Real-time
- [ ] Add enhanced realtime service src/lib/realtime-enhanced.ts
- [ ] Add SSE endpoint src/app/api/admin/realtime/route.ts
- [ ] Create client hook src/hooks/useRealtime.ts and test basic events

### 6) Admin UI: Dashboard and Pages
- [ ] Update src/app/admin/page.tsx to render service request KPIs and charts (calls new analytics/workload endpoints)
- [ ] Add admin pages: src/app/admin/service-requests/{page.tsx,[id]/page.tsx,edit/page.tsx,new/page.tsx}
- [ ] Build components: components/admin/service-requests/{table.tsx,filters.tsx,bulk-actions.tsx,overview.tsx}
- [ ] Integrate ServiceRequestTaskCreator into admin/task flows if applicable

### 7) Client Portal
- [ ] Add portal listings: src/app/portal/service-requests/page.tsx (client-only list)
- [ ] Add detail: src/app/portal/service-requests/[id]/page.tsx with comment thread and status

### 8) Cleanup and Consistency (from audits)
- [ ] Remove or consolidate src/app/lib/* duplicates into src/lib/* and fix imports
- [ ] Replace file-based task comments/templates/notifications with DB-backed endpoints
- [ ] Replace mock dashboard data with real API and guards
- [ ] Standardize zod validation and error shapes across new routes

### 9) Testing and docs
- [ ] Add unit tests for new lib/permissions and helpers
- [ ] Add route tests for service-requests and templates
- [ ] Update docs/ to reflect new endpoints and flows

## Change Log
- [ ] YYYY-MM-DD: Created this TODO+log; no code changes yet. Next: start with Prisma schema updates.
