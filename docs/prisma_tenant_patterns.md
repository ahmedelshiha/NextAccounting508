# Prisma Tenant Patterns

This document outlines safe, repeatable patterns for using Prisma in a multi-tenant environment.

## Imports and Client Access

- Use the default export from `src/lib/prisma.ts` for most code paths:

```ts
import prisma from '@/lib/prisma'
```

- When you need the concrete client (for long transactions or helpers), use:

```ts
import { getPrisma } from '@/lib/prisma'
const prismaClient = await getPrisma()
```

Both options attach the tenant guard automatically.

## Reads and Writes

- Always scope by tenant using context-derived tenantId:

```ts
import prisma from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'

export async function listInvoices() {
  const { tenantId } = requireTenantContext()
  return prisma.invoice.findMany({ where: { tenantId } })
}

export async function createService(data: { name: string }) {
  const { tenantId } = requireTenantContext()
  return prisma.service.create({ data: { ...data, tenantId } })
}
```

## Transactions

- Use $transaction for grouped operations, still deriving tenant from context, not parameters:

```ts
import { getPrisma } from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'

export async function moveTasks(taskIds: string[], toCategoryId: string) {
  const { tenantId } = requireTenantContext()
  const prisma = await getPrisma()
  return prisma.$transaction(async (tx) => {
    await tx.task.updateMany({ where: { id: { in: taskIds }, tenantId }, data: { categoryId: toCategoryId } })
    return tx.task.findMany({ where: { id: { in: taskIds }, tenantId } })
  })
}
```

## Bulk Mutations

- Always constrain bulk writes with tenantId in the where clause. The guard will block missing/incorrect scopes.

```ts
import prisma from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'

export async function archiveOldPosts(before: Date) {
  const { tenantId } = requireTenantContext()
  return prisma.post.updateMany({
    where: { tenantId, createdAt: { lt: before } },
    data: { archived: true },
  })
}
```

- For createMany/upsert, do not accept tenantId from callers; inject from context:

```ts
export async function importClients(rows: Array<{ name: string; email: string }>) {
  const { tenantId } = requireTenantContext()
  return prisma.client.createMany({
    data: rows.map(r => ({ ...r, tenantId })),
    skipDuplicates: true,
  })
}
```

## Pagination Patterns

- Always include tenantId in paginated reads; prefer cursor pagination for stability.

```ts
export async function listTasksPage(opts: { take: number; cursor?: string | null }) {
  const { tenantId } = requireTenantContext()
  const take = Math.min(Math.max(opts.take, 1), 100)
  const where = { tenantId }
  const tasks = await prisma.task.findMany({
    where,
    take,
    ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
    orderBy: { createdAt: 'desc' },
  })
  const nextCursor = tasks.length === take ? tasks[tasks.length - 1]?.id ?? null : null
  return { tasks, nextCursor }
}
```

- For offset pagination, still include tenantId and a deterministic order:

```ts
export async function listInvoicesOffset(page: number, pageSize: number) {
  const { tenantId } = requireTenantContext()
  const take = Math.min(Math.max(pageSize, 1), 100)
  const skip = Math.max((page - 1) * take, 0)
  const [items, total] = await Promise.all([
    prisma.invoice.findMany({ where: { tenantId }, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.invoice.count({ where: { tenantId } }),
  ])
  return { items, total, page, pageSize: take }
}
```

## Raw SQL

- Prefer ORM. For raw SQL, include tenant constraints from context:

```ts
import { getPrisma } from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'

export async function recentReports(limit = 50) {
  const { tenantId } = requireTenantContext()
  const prisma = await getPrisma()
  return prisma.$queryRawUnsafe(
    'SELECT id, title, created_at FROM reports WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2',
    tenantId,
    limit,
  )
}
```

## Background Jobs and Scripts

- Establish tenant context explicitly before using Prisma:

```ts
import { tenantContext, type TenantContext } from '@/lib/tenant-context'

export async function runForTenant(tenantId: string) {
  const ctx: TenantContext = { tenantId, timestamp: new Date() }
  return tenantContext.run(ctx, async () => {
    // Safe to call prisma/services here
  })
}
```

## Guard Behavior

- Missing tenant filters on reads may be logged as warnings; mutations without tenant or with mismatched tenant may throw errors.
- Auth models (Account, Session, VerificationToken) are excluded from tenant guard.

## Verification Checklist

- All access paths derive tenant from context.
- No functions accept tenantId from request bodies or UI parameters.
- Transactions remain tenant-scoped throughout.
- Raw queries include tenant filters.
