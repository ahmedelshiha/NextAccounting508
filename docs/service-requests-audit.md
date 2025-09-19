# Service Requests Module – Comprehensive Audit

Owner: admin • Generated: <%= new Date().toISOString() %>

## Overview

- Purpose: End-to-end intake, triage, execution, and collaboration for client service requests. Enables clients to submit requests via Portal; staff/admin manage lifecycle, assignments, tasks, analytics, and exports.
- High-level features:
  - Client (Portal): create/track requests, approve/cancel, comment with attachments, CSV export, real-time updates.
  - Admin: list/filter, detail view, status transitions, manual assignment, bulk actions (delete/status), task linking/creation, analytics dashboard, CSV export.
  - Automation: auto-assignment to team members based on skill/workload.
  - Analytics/Reporting: aggregate counts, priority/status distribution, pipeline value, CSV exports (admin/portal).
- Relationships:
  - Users: ServiceRequest.client -> User; assignedBy -> User; ServiceRequestComment.author -> User.
  - Services: ServiceRequest.service -> Service.
  - Tasks: RequestTask links Task to ServiceRequest; comments on Task separate.
  - Team: ServiceRequest.assignedTeamMember -> TeamMember.
  - Attachments: Attachment.serviceRequestId -> ServiceRequest (Portal POST persists Attachment records). Also JSON attachments stored directly on ServiceRequest for quick display.
  - Notifications: realtimeService (SSE) broadcasts events; best-effort emails on status/assignment.

## Complete Current Directory Structure

Legend: ✅ reusable/shared • ⚠️ duplicate/placeholder/mismatch

- src/lib/service-requests/
  - assignment.ts ✅ (auto-assign logic)
- src/components/admin/service-requests/
  - overview.tsx
  - filters.tsx
  - table.tsx
  - bulk-actions.tsx
  - request-status-distribution.tsx
  - team-workload-chart.tsx
- src/app/admin/service-requests/
  - page.tsx (list + analytics + bulk)
  - new/page.tsx (create form)
  - [id]/page.tsx (detail; status, assign, tasks, comments)
  - [id]/edit/page.tsx (edit form)
- src/app/api/admin/service-requests/
  - route.ts (GET list, POST create)
  - export/route.ts (GET csv)
  - analytics/route.ts (GET metrics)
  - bulk/route.ts (POST bulk status/delete)
  - [id]/route.ts (GET, PATCH, DELETE)
  - [id]/status/route.ts (PATCH)
  - [id]/assign/route.ts (POST)
  - [id]/comments/route.ts (GET, POST)
  - [id]/tasks/route.ts (GET, POST)
- src/app/portal/service-requests/
  - page.tsx (Suspense wrapper)
  - ServiceRequestsClient.tsx (client list, filters, export, SSE)
  - new/page.tsx (create w/ uploads)
  - [id]/page.tsx (detail, approve/cancel, comments, uploads)
- src/app/api/portal/service-requests/
  - route.ts (GET own list, POST create)
  - export/route.ts (GET csv)
  - [id]/route.ts (GET, PATCH approve/cancel)
  - [id]/comments/route.ts (GET, POST)

Notes:
- ⚠️ Request scope listed "src/lib/service-requests/assignments" but actual path is src/lib/service-requests/assignment.ts.
- ✅ Shared utilities used widely: src/lib/permissions.ts, src/lib/api-response.ts, src/lib/tenant.ts, src/lib/realtime-enhanced.ts, src/lib/prisma.ts.

## Component Architecture Details

Key React components and roles:
- Admin
  - components/admin/service-requests/overview.tsx: fetches analytics; export CSV button gated by ANALYTICS_EXPORT.
  - filters.tsx: controlled search/status/priority filters.
  - table.tsx: list presentation with badges and selection.
  - bulk-actions.tsx: bulk status update and delete with permission gates.
  - request-status-distribution.tsx: Pie chart of status distribution.
  - team-workload-chart.tsx: Bar chart reading /api/admin/team-management/workload.
  - pages:
    - page.tsx: orchestrates filters, table, bulk actions; subscribes to realtime via useRealtime.
    - new/page.tsx: admin creation form; loads clients/services; posts to /api/admin/service-requests.
    - [id]/page.tsx: detail view; status changes, assign, create Request-linked Task, comments.
    - [id]/edit/page.tsx: editing payload; PATCH to /api/admin/service-requests/[id].
- Portal
  - ServiceRequestsClient.tsx: client list, filters, debounced search, CSV export, SSE auto-refresh.
  - new/page.tsx: client create with uploads (XHR progress); posts to /api/portal/service-requests and persists Attachment records.
  - [id]/page.tsx: detail; approve/cancel; comment with attachments; SSE refresh.

Unused/duplicated:
- No obvious unused components; admin and portal CSV export implementations are separate but appropriate for contexts.

## Data Models (Prisma)

Essential models and fields (see prisma/schema.prisma):

- ServiceRequest
  - id (String, cuid, PK), uuid (String, unique, uuid())
  - clientId (String, required) → User via "ServiceRequestClient"
  - serviceId (String, required) → Service
  - title (String, 1..300), description (String?, Text)
  - priority (enum RequestPriority: LOW|MEDIUM|HIGH|URGENT, default MEDIUM)
  - status (enum RequestStatus: DRAFT|SUBMITTED|IN_REVIEW|APPROVED|ASSIGNED|IN_PROGRESS|COMPLETED|CANCELLED, default DRAFT)
  - budgetMin/Max (Decimal?)
  - deadline (DateTime?)
  - requirements (Json?), attachments (Json?)
  - assignedTeamMemberId (String?) → TeamMember, assignedAt (DateTime?), assignedBy (String?) → User
  - completedAt, clientApprovalAt (DateTime?)
  - tenantId (String?)
  - Relations: requestTasks (RequestTask[]), comments (ServiceRequestComment[]), attachmentsRel (Attachment[])
  - Indexes: clientId; tenantId; (tenantId,status); (tenantId,assignedTeamMemberId)
- RequestTask
  - id (String, cuid), serviceRequestId (String) → ServiceRequest, taskId (String) → Task
  - unique(serviceRequestId, taskId)
- ServiceRequestComment
  - id (String, cuid), serviceRequestId (String) → ServiceRequest
  - authorId (String?), content (Text), attachments (Json?), timestamps
- TeamMember
  - id, name, email, userId?, role, specialties (String[]), isAvailable, status, etc.
- Attachment
  - id, key/url/name/size/contentType
  - avStatus/avDetails/avScanAt/avThreatName/avScanTime (AV integration fields)
  - serviceRequestId (String?), tenantId (String?)
- User: includes back-relations for ServiceRequest (client, assignedBy) and comments.

## Data Flow Architecture

- UI → API → DB
  - Client-side forms/components call apiFetch to /api/(admin|portal)/service-requests...
  - API routes validate with zod; enforce RBAC and tenancy; persist via Prisma; return typed ApiResponse helpers.
- State management
  - Local component state via useState; realtime refresh via useRealtime (admin) and EventSource SSE (portal).
  - No React Query/SWR; manual fetch+setState patterns.
- Caching & realtime
  - Responses are not cached; CSV endpoints set Cache-Control: no-store.
  - realtimeService dispatches events: service-request-updated, task-updated, team-assignment; PG or in-memory transport.
- Optimistic updates
  - None; relies on realtime or subsequent fetch after POST/PATCH.

### Custom Hooks (related)

- useRealtime(topics: string[]) → { events, getLatestEvent }
  - Subscribes to SSE events via centralized service; components trigger reload on relevant events.
- usePermissions() → { has(permission): boolean }
  - Wraps ROLE_PERMISSIONS mapping; used to gate UI controls.

## API Architecture

All responses use respond.{ok|created|badRequest|...} with shape { success, data | error } unless explicitly NextResponse for CSV.

Admin routes (/api/admin/service-requests)
- GET route.ts
  - Query: page (1..100), limit (1..100), status, priority, assignedTo, clientId, serviceId, q
  - RBAC: SERVICE_REQUESTS_READ_ALL
  - Returns: data: ServiceRequest[] (with client, service, assignedTeamMember), pagination meta
  - Tenancy: tenantFilter applied
- POST route.ts
  - Body: { clientId, serviceId, title (>=5, <=300), description?, priority (enum w/ lowercase transform), budgetMin?, budgetMax?, deadline ISO?, requirements?, attachments? }
  - RBAC: SERVICE_REQUESTS_CREATE; rateLimit key service-requests:create
  - Side effects: autoAssignServiceRequest(created.id) best-effort; realtime to client; audit log
- [id]/route.ts
  - GET: RBAC SERVICE_REQUESTS_READ_ALL; returns full item with client/service/assigned/requestTasks
  - PATCH: RBAC SERVICE_REQUESTS_UPDATE; zod validation; converts deadline; realtime + audit
  - DELETE: RBAC SERVICE_REQUESTS_DELETE; delete RequestTask relations first; realtime + audit
- [id]/status/route.ts
  - PATCH body { status enum }; RBAC SERVICE_REQUESTS_UPDATE; tenancy check; realtime; best-effort email to client
- [id]/assign/route.ts
  - POST body { teamMemberId }; RBAC SERVICE_REQUESTS_ASSIGN; tenancy check; sets assignedAt, assignedBy, status ASSIGNED; realtime + email; audit
- [id]/comments/route.ts
  - GET: RBAC SERVICE_REQUESTS_READ_ALL; tenancy enforced
  - POST body { content, attachments? }; RBAC SERVICE_REQUESTS_UPDATE; rate limited; realtime + audit
- [id]/tasks/route.ts
  - GET: RBAC TASKS_READ_ALL; returns tasks linked via RequestTask
  - POST body { title, description?, priority (maps low/critical), dueAt ISO? | dueDate, assigneeId? }
  - RBAC TASKS_CREATE; creates Task then RequestTask link; realtime + audit
- export/route.ts
  - GET CSV: RBAC ANALYTICS_EXPORT; includes client, service, assigned; tenant scoped
- analytics/route.ts
  - GET: RBAC ANALYTICS_VIEW; returns totals, distributions, pipelineValue; dev fallback if Prisma unavailable

Portal routes (/api/portal/service-requests)
- route.ts
  - GET: own list with filters (status, priority, q); tenant filter
  - POST: create for current user; validates service active; persists attachments to Attachment table; dev fallbacks
- [id]/route.ts
  - GET: own item with service+comments; tenancy enforced
  - PATCH: limited actions: { description } or { action: 'approve'|'cancel' } with server-side guards
- [id]/comments/route.ts
  - GET: own comments; POST: create own comment with attachments metadata; rate limited
- export/route.ts
  - GET CSV: own requests, up to 5000 rows; dev fallback

Validation
- zod schemas per route; zodDetails() returns error.flatten() to caller; consistent 400 on invalid payload.

## Business Rules & Validation

- Creation (admin): requires clientId, serviceId, title>=5; priority defaults MEDIUM; deadline string must be datetime; rate limiting.
- Creation (portal): client-only; service must exist & active; status forced to SUBMITTED; attachments persisted to Attachment records.
- Status transitions (admin): free-form to any enum but gated by RBAC and tenancy; PATCH /status.
- Client actions (portal):
  - approve allowed only when status in SUBMITTED/IN_REVIEW/APPROVED and not CANCELLED/COMPLETED; sets clientApprovalAt.
  - cancel not allowed from IN_PROGRESS/COMPLETED/CANCELLED.
- Auto-assignment: assigns to available active TeamMember by skill match (service.category) then least workload over active statuses (ASSIGNED|IN_PROGRESS).
- Export: CSV for admin (all scoped by tenant) and portal (own only).

## Integration Points

- Users/Auth: next-auth session; role in session.user.role; permissions via lib/permissions.
- Tenanting: lib/tenant (x-tenant-id header or subdomain) with feature gate env MULTI_TENANCY_ENABLED.
- Realtime: lib/realtime-enhanced (EventEmitter + PG notify adapter) with SSE endpoint elsewhere; components use useRealtime or EventSource.
- Email: lib/email sendEmail best-effort on status/assignment.
- Tasks: RequestTask relations; admin UI creates tasks inline; Task schema independent.
- Uploads & AV: /api/uploads handles file upload; Attachment model stores AV fields; quarantine UI under /admin/uploads/quarantine.
- Bookings: no direct runtime coupling; shared TeamMember concept appears in both features.

## Security & Permissions

- RBAC: enforced in every admin route via hasPermission(); portal routes restrict to own user IDs.
- Rate limiting: getClientIp + rateLimit() across create/update/comment/bulk/task endpoints.
- Tenancy: tenantFilter in queries; strict checks on id-owned routes to prevent cross-tenant access when enabled.
- Input validation: zod schemas, type normalization for priority/status; respond.* helpers standardize error shape.
- Sensitive data: only selected fields are returned for related entities (select in Prisma includes).

## Testing Coverage

- tests/admin-service-requests.route.test.ts: admin list pagination, POST validation, POST create.
- tests/portal-service-requests.route.test.ts: portal list (own), POST validation + priority normalization.
- tests/status-transitions.test.ts: RBAC on status PATCH, invalid payload, authorized updates (ADMIN, TEAM_MEMBER).
- tests/portal-service-request-id.route.test.ts: portal GET own item; approve/cancel transitions.
- tests/portal-comments.route.test.ts: portal comments GET/POST validation; attachments metadata accepted.
- tests/auto-assignment.test.ts: autoAssignServiceRequest skill-preference and workload fallback; idempotency.

Gaps/Risks:
- No explicit e2e tests for admin comments/tasks endpoints; coverage is good at API unit level but could add UI integration tests.
- Attachment persistence asymmetry (see Cleanup Notes) is untested.

## Performance Considerations

- Queries:
  - List endpoints paginate with skip/take; consider cursor pagination for large datasets.
  - Analytics uses groupBy/aggregate; ensure appropriate DB indexes (status, priority, tenantId) – many already present on ServiceRequest.
- Export endpoints select related data and stream CSV up to 5k rows (portal). For admin, no explicit limit; consider streaming or server-side pagination for very large datasets.
- Realtime uses SSE; PG notify adapter available. Ensure REALTIME_TRANSPORT='postgres' for scale-out.
- CSR vs SSR: All UIs are client components; initial page loads fetch client-side. Consider server components for initial data where SEO/TTFB matters (admin dashboard less critical).

## Cleanup Notes

- ⚠️ Path mismatch in brief: "src/lib/service-requests/assignments" vs actual "src/lib/service-requests/assignment.ts".
- Inconsistency: admin POST accepts attachments on ServiceRequest JSON but does not persist Attachment rows; portal POST does. Align behavior or document intent.
- Validation consistency: Some endpoints accept both lowercase/uppercase priority; ensure UI aligns; consider centralizing enums and transforms.
- Rate limit keys vary (service-requests:* vs portal:service-requests:*); acceptable but unify naming for observability.
- Dev fallbacks: several routes use lib/dev-fallbacks when Prisma errors with P20xx. Keep for DX but ensure production disables or logs clearly.
- Consider adding:
  - Server-side schema validation shared module for ServiceRequest payloads.
  - Additional tests for admin comments/tasks endpoints and CSV exports.
  - Pagination controls UI for admin list (page/limit already supported).

## Useful Snippets

- Create (admin) payload validator:
```ts
const CreateSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  title: z.string().min(5).max(300),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW','MEDIUM','HIGH','URGENT']),
    z.enum(['low','medium','high','urgent']).transform(v => v.toUpperCase() as const),
  ]).default('MEDIUM'),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  attachments: z.any().optional(),
})
```

- Auto-assignment core:
```ts
const ACTIVE: RequestStatus[] = ['ASSIGNED','IN_PROGRESS']
const workloads = await Promise.all(teamMembers.map(async (tm) => ({
  tm,
  count: await prisma.serviceRequest.count({ where: { assignedTeamMemberId: tm.id, status: { in: ACTIVE } } }),
  skillMatch: request.service?.category ? (tm.specialties ?? []).includes(request.service.category) : false,
})))
const chosen = workloads.sort((a,b) => (Number(b.skillMatch)-Number(a.skillMatch)) || (a.count - b.count))[0]
```

- RBAC guard + tenancy pattern:
```ts
const session = await getServerSession(authOptions)
const role = (session?.user as any)?.role
if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) return respond.unauthorized()
const tenantId = getTenantFromRequest(req as any)
if (isMultiTenancyEnabled()) { /* apply tenantFilter / ownership checks */ }
```

---

This audit reflects the code as of repository state at generation time. Suggested action items are in Cleanup Notes.
