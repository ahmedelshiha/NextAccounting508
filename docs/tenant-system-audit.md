# Tenant System Audit Report

## Executive Summary
- **Strengths**
  - The `tenantFilter` helper (`src/lib/tenant.ts`) is applied consistently in many services and APIs, giving a reusable way to scope Prisma queries.
  - Middleware already centralizes admin/portal authentication logic and forwards tenant hints when multi-tenancy is toggled on.
  - Integration tests (e.g. `tests/integration/org-settings.tenant-isolation.test.ts`) verify tenant-aware routes return tenant-specific payloads.
- **Weaknesses**
  - Core tables including `User`, `Task`, `ComplianceRecord`, and audit/log tables lack a `tenantId` column, making row-level isolation impossible in large parts of the schema.
  - Optional `tenantId` columns combined with `@@unique([tenantId])` or `@@unique([tenantId, slug])` allow unlimited `NULL` rows and undermine singleton guarantees for global defaults.
  - There is no binding between authenticated sessions and tenants; APIs trust client-provided `x-tenant-id` headers.
- **Critical Risks**
  - Admin task endpoints (e.g. `src/app/api/admin/tasks/[id]/route.ts`) query `prisma.task` without any tenant scoping, exposing all tenants’ tasks to any authenticated staff user who forges the header.
  - `getTenantFromRequest` (`src/lib/tenant.ts`) accepts arbitrary headers, so any client can impersonate another tenant by sending `x-tenant-id`.
  - Middleware matcher omits `/api/*`, so backend routes receive unvalidated tenant headers even when accessed cross-origin.
- **Priority Recommendations**
  - Add `tenantId` (with proper indexes) to every tenant-owned model and backfill existing rows; introduce partial unique indexes to enforce singleton defaults.
  - Extend authentication to store `tenantId`/allowed tenant list in the JWT and compare it with headers or signed cookies before executing handlers.
  - Introduce Prisma middleware or repository wrappers that automatically append `tenantId` filters, and add Postgres RLS policies where feasible.

## Database & Schema
**Strengths**
- Service and settings tables already include `tenantId` columns and indexes (`prisma/schema.prisma` lines around the `Service` and `BookingSettings` models).
- Several tenant-aware relations exist (e.g. `ServiceRequest.tenantId`) enabling future enforcement.

**Weaknesses**
- Many critical entities lack tenant columns, including `Task` and `ComplianceRecord`:

`prisma/schema.prisma`:
```prisma
model Task {
  id        String       @id @default(cuid())
  // ...
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  @@index([status])
}
```
- Optional tenant fields combined with `@@unique([tenantId])` allow multiple NULL rows:

`prisma/schema.prisma`:
```prisma
model OrganizationSettings {
  id       String   @id @default(cuid())
  tenantId String?  @unique
  // ...
}
```
- No foreign keys ensure child rows (e.g. `Booking`, `ServiceRequest`) share the parent’s tenant.

**Risks**
- Without a `tenantId` on `Task`, any tenant can read/update another tenant’s tasks once they reach task APIs.
- Duplicate “global” rows can be inserted for tables expecting singleton defaults, leading to non-deterministic fallbacks.
- Cross-tenant references (e.g. a booking pointing to another tenant’s service) are possible because the DB never validates tenant consistency.

**Recommendations**
- Add `tenantId` columns to missing models (`User`, `Task`, `ComplianceRecord`, `HealthLog`, etc.) and backfill existing rows via migration scripts that join through tenant-owned parents.
- Replace nullable unique constraints with partial unique indexes per Postgres:

```sql
CREATE UNIQUE INDEX organization_settings_global_unique
ON public.organization_settings ((tenantId))
WHERE tenantId IS NULL;
```

- Enforce tenant integrity with compound foreign keys or CHECK constraints (e.g. `FOREIGN KEY (serviceId, tenantId)` referencing `service(id, tenantId)`).
- Evaluate Postgres RLS policies once schema carries tenant columns; e.g.:

```sql
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON public.service_requests
  USING ("tenantId" = current_setting('app.current_tenant')::text);
```

## Authentication & Tenant Binding
**Strengths**
- NextAuth JWT callback already enriches tokens with role and versioning (`src/lib/auth.ts`), providing a hook to attach tenant info.

**Weaknesses**
- Sessions contain only `id` and `role`; there is no tenant attribute (`src/types/next-auth.d.ts`).
- `getTenantFromRequest` trusts client headers or subdomains:

`src/lib/tenant.ts`:
```ts
export function getTenantFromRequest(req: Request): string | null {
  const header = req.headers.get('x-tenant-id')
  if (header) return header
  const url = new URL((req as any).url || 'http://localhost')
  return extractSubdomain(url.hostname)
}
```
- There is no persistent mapping of users to tenants in the database.

**Risks**
- Any authenticated user can impersonate other tenants by sending a forged `x-tenant-id`.
- Without tenant affinity in the JWT, there is no way to detect mismatches between session and header/subdomain.

**Recommendations**
- Add a `tenantMemberships` join table (userId, tenantId, default flag) and hydrate JWT/session with the tenant chosen at login.
- Sign tenant assignments in cookies (e.g. `tenant=<id>; tenant_sig=<HMAC>`) and validate both before honoring headers.
- Reject requests when `x-tenant-id` does not match the authenticated user’s allowed tenants; fall back to subdomain-derived tenant only after verification.

## Middleware & Request Context
**Strengths**
- Middleware already enforces auth for `/admin` and `/portal`, and forwards tenant cookies to headers when set (`src/app/middleware.ts`).

**Weaknesses**
- The matcher excludes API routes:

`src/app/middleware.ts`:
```ts
export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/register'],
}
```
- There is no AsyncLocalStorage context for tenant-aware logging or DB guards.
- Middleware does not forbid pre-existing `x-tenant-id` values from upstream clients.

**Risks**
- `/api/*` requests bypass middleware, so backend receives raw headers from the client or third parties.
- Parallel requests may reuse shared state in services without tenant isolation.

**Recommendations**
- Expand the matcher to include `/api/:path*` (while handling static assets separately) so tenant headers are derived server-side.
- Strip or overwrite inbound `x-tenant-id` unless it matches a validated signed cookie.
- Introduce an AsyncLocalStorage store that records the tenant for each request and exposes it to Prisma extensions and logging.

## Prisma Client & Tenant Enforcement
**Strengths**
- Services such as `ServicesService` consistently pass tenant-aware filters when calling Prisma.

**Weaknesses**
- `src/lib/prisma.ts` simply proxies the client; no `$use` middleware enforces tenant scoping.
- Numerous routes access `prisma` directly (e.g. admin task handlers) without the helper functions.

**Risks**
- Developers can easily omit tenant clauses, leading to data leakage.
- Bulk operations (e.g. `prisma.task.updateMany`) could touch every tenant when filters are forgotten.

**Recommendations**
- Wrap the Prisma client with an extension that requires a tenant in the query payload for configured models:

```ts
const tenantScopedModels = new Set(['Task','ServiceRequest','Booking']);
prisma.$use(async (params, next) => {
  if (tenantScopedModels.has(params.model) && !params.args?.where?.tenantId) {
    params.args.where = { ...(params.args?.where ?? {}), tenantId: getTenantFromAls() };
  }
  return next(params);
});
```

- Provide repository helpers (`taskRepo.findById(tenantId, id)`) and ban direct `prisma.task` imports via lint rules to enforce usage.

## APIs & Services
**Strengths**
- Many admin routes call `tenantFilter` before hitting Prisma (e.g. `src/app/api/admin/org-settings/route.ts`).

**Weaknesses**
- Admin task endpoints run unscoped queries:

`src/app/api/admin/tasks/[id]/route.ts`:
```ts
const task = await prisma.task.findUnique({ where: { id }, include: { assignee: { ... } } })
```

- Analytics endpoints mix tenant-aware and tenant-agnostic queries:

`src/app/api/admin/tasks/analytics/route.ts`:
```ts
const complianceCompleted = await prisma.complianceRecord.count({ where: { status: { equals: 'COMPLETED' } } })
```

- Several portal routes rely purely on the incoming header for validation.

**Risks**
- Any admin can enumerate or mutate other tenants’ tasks by guessing IDs.
- Aggregated metrics blend tenants, exposing business KPIs across clients.
- Portal users could escalate access by swapping headers.

**Recommendations**
- Audit every route under `src/app/api` and ensure `tenantFilter` (or equivalent) is applied to `find*`, `update*`, `delete*`, and `groupBy` calls.
- Introduce integration tests that call sensitive routes with mismatched tenants and expect 403/404 responses.
- Forbid raw `findUnique({ where: { id } })` on tenant-owned tables; require composite key lookups (`{ id, tenantId }`).

## Settings & Singletons
**Strengths**
- Settings services (e.g. `src/services/integration-settings.service.ts`) use caches keyed by tenant and default fallback logic.

**Weaknesses**
- Default rows (`tenantId = null`) are not protected by unique indexes.
- Seeded defaults can conflict with tenant-specific rows when duplicates arise.

**Risks**
- Two “global” settings rows could exist, and fallback queries `findFirst({ where: { tenantId: undefined } })` would return arbitrary rows.
- Cache invalidation may misbehave when multiple global records exist.

**Recommendations**
- Add partial unique indexes for each singleton (`BookingSettings`, `OrganizationSettings`, `IntegrationSettings`, etc.).
- Normalize defaults into explicit `DEFAULT` tenant entries and avoid relying on `null`.
- Ensure cache keys differentiate between `null` and actual tenant IDs consistently.

## Seeding & Migrations
**Strengths**
- `prisma/seed.ts` populates demo data for quick onboarding.
- Scripts like `scripts/seed-security-settings.ts` demonstrate how to create tenant-specific rows.

**Weaknesses**
- Seed data creates only global (`tenantId = null`) records; there is no canonical tenant seeding or membership creation.
- Migration directories lack SQL ensuring tenant constraints (only a README exists).

**Risks**
- Environments initialized with the seed have no tenant assignments, encouraging production data without isolation.
- Schema drift may occur because required indexes/policies are not codified in migrations.

**Recommendations**
- Extend the seed to create at least one tenant, associated users, and tenant-scoped settings.
- Generate migrations that add tenant columns, indexes, and partial uniques, and ensure CI runs `prisma migrate deploy`.
- Provide rollback scripts for tenant additions to avoid downtime.

## Testing & QA
**Strengths**
- Existing tests cover positive tenant scenarios (e.g. `tests/integration/org-settings.tenant-isolation.test.ts`).

**Weaknesses**
- No tests simulate forged headers or missing tenant bindings.
- Task and analytics routes lack isolation tests.

**Risks**
- Regression bugs could silently reintroduce leaks without detection.
- Developers might assume coverage exists and skip manual verification.

**Recommendations**
- Add integration tests that call tenant-scoped APIs with mismatched `x-tenant-id` and expect rejection.
- Mock Prisma in unit tests to assert queries include `tenantId`.
- Introduce Playwright smoke tests for subdomain-based tenant routing once binding is implemented.

## Logging & Observability
**Strengths**
- `src/lib/logger.ts` standardizes structured logging across the app.
- Audit utilities exist (`src/lib/audit.ts`).

**Weaknesses**
- Neither logger nor audit payloads include tenant context.
- Sentry spans (`src/lib/observability.ts`) lack tenant tags.

**Risks**
- Incident response cannot determine which tenant experienced an issue.
- Audit trail stored in `healthLog` is cross-tenant and unverifiable.

**Recommendations**
- Pass tenant information from AsyncLocalStorage to logging/audit helpers:

```ts
logger.info('API Request', { tenantId, method, path, userId });
```

- Persist audit logs in a dedicated `TenantAudit` table with a `tenantId` column.
- Configure Sentry to set `user.tenant` or `tags.tenant` for every captured event.

## Recommendations & Roadmap
- **P0 (must fix immediately)**
  - Add tenant columns and constraints to missing tables (Task, ComplianceRecord, HealthLog) and backfill existing data.
  - Enforce tenant binding in authentication; reject requests when header, cookie, or session tenants diverge.
  - Patch high-risk APIs (`src/app/api/admin/tasks`, analytics endpoints) to include tenant filters or composite where clauses.
- **P1 (important, fix soon)**
  - Implement Prisma middleware/ALS-based tenant enforcement and codify partial unique indexes via migrations.
  - Expand middleware coverage to `/api/*`, sanitize inbound `x-tenant-id`, and create signed tenant cookies.
  - Seed canonical tenant data with membership records; update tests to cover cross-tenant isolation and header forgery.
- **P2 (nice-to-have, future)**
  - Roll out Postgres RLS policies for critical tables once schema carries tenant IDs.
  - Enhance observability with tenant-aware logging, Sentry tags, and dedicated audit tables.
  - Automate schema validation (lint rules) to block new models without tenant governance.
