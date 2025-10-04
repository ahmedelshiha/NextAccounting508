# Tenant System Audit TODO

## ✅ Completed
- [x] Fixed duplicate NextRequest/NextResponse imports across admin API routes (analytics-settings, client-settings, integration-hub, security-settings, task-settings, services/[id], availability-slots, admin/export).
  - **Why**: Duplicate symbol declarations broke typecheck.
  - **Impact**: Restored clean module scopes for Next.js route handlers.
- [x] Patched legacy bookings proxy to pass a context argument to wrapped handlers, fixing TS2554.
  - **Why**: Some withTenantContext handlers have a 2-arg signature (request, context).
  - **Impact**: Type-safe delegation to admin/portal service-request routes.
- [x] Added TenantMembership model to Prisma schema and generated types.
  - **Why**: Code depends on prisma.tenantMembership for tenant switching and auth.
  - **Impact**: Resolved missing Prisma client properties and enabled per-user multi-tenant membership.
- [x] Updated prisma-tenant-guard to import Prisma as a value, relaxed MiddlewareParams typing, and registered middleware via client.$use with explicit any casts.
  - **Why**: Prisma v6 typings differ; previous import-as-type blocked access to Prisma.dmmf and $use typing.
  - **Impact**: Guard compiles and enforces tenant rules during Prisma operations.
- [x] Rolled middleware requestId/userId/tenantId structured logging across /api.
  - **Why**: Provide consistent tracing metadata for tenant-aware monitoring and debugging.
  - **Impact**: Every API request now emits correlated entry/exit logs, propagates x-request-id to handlers, and attaches tenant/user identifiers for observability.

## ⚠️ Issues / Risks
- None observed after the middleware update; keep an eye on log volume growth once deployed to staging.

## 🚧 In Progress
- No active tenant-system workstreams are currently in flight.

## 🔧 Next Steps
- [ ] Run `pnpm db:generate` followed by `pnpm typecheck` in CI to validate schema changes.
- [ ] Audit remaining API routes for accidental duplicate imports.
- [ ] Add tenant switch regression tests to ensure membership enforcement and JWT rotation.
- [ ] Instrument log forwarding dashboards to highlight new requestId and tenant correlation fields.
