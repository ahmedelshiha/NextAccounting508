# Tenant Context Tasks Guide

This guide explains how tenant context flows through the app, how to write code that preserves it, and the concrete tasks to keep it reliable across API routes, services, jobs, and database access.

## Core Concepts

- Context carrier: src/lib/tenant-context.ts implements an AsyncLocalStorage-backed TenantContext with methods:
  - tenantContext.run(context, fn)
  - tenantContext.getContext() / getContextOrNull()
  - tenantContext.requireTenantId(), getTenantId(), isSuperAdmin()
- Request wrapper: src/lib/api-wrapper.ts provides withTenantContext(handler) to resolve tenant and execute the handler inside tenantContext.run(...).
- Prisma: src/lib/prisma.ts dynamically imports @prisma/client and registers a tenant guard via registerTenantGuard. Default export is a proxy that defers to an async client; explicit getPrisma() is also available.
- Guard: src/lib/prisma-tenant-guard.ts enforces tenant scoping on Prisma operations when multi-tenancy is enabled.

## Authoring API Routes

Always wrap handlers with withTenantContext and derive tenant/user data from requireTenantContext:

```ts
// src/app/api/example/route.ts
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'

export const GET = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const items = await prisma.post.findMany({ where: { tenantId } })
  return Response.json({ items })
})
```

Notes:
- Never compute tenant from query/body inside business logic; use withTenantContext resolution.
- Avoid calling tenantContext.getContext() directly in routes; use requireTenantContext() for consistent errors.

## Services and Libraries

- Service entry points should not accept tenantId parameters from callers; read from requireTenantContext() to reduce mismatches.
- If a service method is reused in a non-request path, pass an explicit context object and call tenantContext.run(context, () => service(...)).

```ts
// src/services/example.service.ts
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'

export async function listPosts() {
  const { tenantId } = requireTenantContext()
  return prisma.post.findMany({ where: { tenantId } })
}
```

## Prisma Usage Patterns

- Preferred: import prisma default proxy and call methods normally. The proxy awaits the real client under the hood and keeps existing call sites synchronous.
- Explicit: when you need the client instance (e.g., long-lived transactions), use:

```ts
import { getPrisma } from '@/lib/prisma'
const prismaClient = await getPrisma()
await prismaClient.$transaction(async (tx) => {
  // use tx here
})
```

- All queries must be tenant-scoped. If your model has tenantId, include it in where/data as appropriate. The tenant guard logs and/or throws when scope is missing or mismatched.

## Raw SQL Helpers

- Prefer ORM. If you must use raw queries, ensure the query includes tenant scoping derived from requireTenantContext().

```ts
import { requireTenantContext } from '@/lib/tenant-utils'
import { getPrisma } from '@/lib/prisma'

export async function rawReports() {
  const { tenantId } = requireTenantContext()
  const prisma = await getPrisma()
  return prisma.$queryRawUnsafe(
    'select id, title from reports where tenant_id = $1 order by created_at desc',
    tenantId,
  )
}
```

## Background Jobs and Scripts

- Jobs and maintenance scripts run outside HTTP. Establish context explicitly:

```ts
import { tenantContext, type TenantContext } from '@/lib/tenant-context'

async function runForTenant(tid: string) {
  const context: TenantContext = { tenantId: tid, timestamp: new Date() }
  return tenantContext.run(context, async () => {
    // safe to use prisma/services that require context
  })
}
```

- Iterate tenants by fetching from DB only after setting a superadmin/system context if needed, then switching per tenant.

## Testing Guidance

- Route/unit tests that touch tenant-scoped code must provide context. Two options:
  1) Wrap the test body with tenantContext.run(...).
  2) Hit the route via app helpers that already wrap with withTenantContext.

```ts
import { tenantContext, type TenantContext } from '@/lib/tenant-context'

it('reads tenant data', async () => {
  const ctx: TenantContext = { tenantId: 't1', timestamp: new Date() }
  await tenantContext.run(ctx, async () => {
    // invoke service or prisma calls here
  })
})
```

- For DB-free tests, set PRISMA_MOCK=true to receive a safe mock client.

## Observability and Security

- Logging: include tenantId, userId, requestId on structured logs. If using a logger wrapper, read from tenantContext.getContextOrNull().
- Sentry: tag events with tenant context in beforeSend hooks; see sentry.*.config.ts.
- The guard emits warnings or throws on missing tenant scope; treat these as security signals.

## Common Pitfalls

- Accessing prisma before context exists in background jobs. Fix by wrapping with tenantContext.run.
- Forgetting tenant filter on read/update/delete. The guard will warn or block; add tenantId conditions.
- Passing tenantId as a function parameter from UI or request body. Derive from context instead.
- Long-lived references to prisma in modules that resolve before environment variables. Use the default proxy export or call getPrisma() lazily.

## Migration Checklist (Already Enforced)

- Prisma import now uses dynamic ESM import with an async getPrisma() and a proxy default export; no require() usage remains in prisma loader.
- Tenant guard attaches at client creation.
- Tests can continue mocking '@/lib/prisma' default.

## Verification

- Requests succeed only with tenant context present.
- CRUD operations on tenant-scoped models include tenantId constraints.
- Background jobs complete with explicit context.
- Logs and error reports include tenant identifiers.

## Reference

- src/lib/tenant-context.ts
- src/lib/api-wrapper.ts
- src/lib/tenant-utils.ts
- src/lib/prisma.ts
- src/lib/prisma-tenant-guard.ts
