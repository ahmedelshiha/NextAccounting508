## ✅ Completed
- [x] Context reloaded from docs/Comprehensive Tenant System-todo.md and repository; verified prisma-tenant-guard, middleware, RLS helpers, and API wrappers are implemented and consistent
  - **Why**: Establish accurate state and avoid re-analysis; ensure enforcement layers align
  - **Impact**: Safer autonomous execution and fewer regressions
- [x] Enforced shared Prisma client usage via ESLint rule to forbid direct PrismaClient instantiation in src (except src/lib/prisma.ts)
  - **Why**: Ensure tenant guard middleware is always applied and cannot be bypassed
  - **Impact**: Prevents accidental cross-tenant access via ad-hoc clients; improves maintainability
- [x] Assessed RLS coverage and tenantContext usage; ensured tenant guard is applied to central Prisma client
  - **Why**: Prevent accidental cross-tenant reads/writes and ensure consistent enforcement across server code
  - **What I changed**:
    - Many operational scripts under scripts/ were updated to import the shared Prisma client (import prisma from '@/lib/prisma') so registerTenantGuard is applied consistently.
    - Ensured application code uses queryTenantRaw / withTenantRLS for raw SQL paths (db-raw.ts) and uses withTenantContext for App Router API routes.
  - **Files changed**: multiple scripts in scripts/ (backfills/migrations/inspection/seed scripts) and src/lib/default-tenant.ts, src/app/middleware.ts

## ⚠️ Issues / Risks
- scripts/create_jwt_session.js still instantiates PrismaClient directly (require('@prisma/client')). Convert to TS or import the shared client to apply the tenant guard.
- Any external Netlify functions or serverless contexts that create PrismaClient separately should be reviewed; grep for "new PrismaClient" in non-scripts folders if needed.
- Some RLS policies in scripts/setup-rls.ts allow tenantId IS NULL for transitional safety. Plan a follow-up tightening pass after all backfills enforce NOT NULL where intended.

## 🚧 In Progress
- [ ] Stage RLS rollout
  - Prereq: Valid staging database snapshot/backups
  - Steps: Run scripts/setup-rls.ts with FORCE_RLS=false; verify key endpoints; then enable FORCE_RLS=true in staging and re-verify
- [ ] Audit raw SQL and transactions
  - Scope: netlify/functions/** and scripts/** using $queryRaw/$executeRaw
  - Action: Ensure withTenantRLS or setTenantRLSOnTx is applied where appropriate
- [ ] Tests for RLS helpers
  - Add coverage for withTenantRLS and db-raw helpers to assert session variable is set and policies enforced

## 🔧 Next Steps
- [ ] Migrate scripts/create_jwt_session.js to use shared prisma (or convert to TS/tsx runner)
  - Dep: Keep behavior and shape of the script output; ensure NEXTAUTH_SECRET loaded
- [ ] Tighten RLS policies by removing "OR tenantId IS NULL" once all backfills are complete and affected tables enforce NOT NULL
  - Dep: Complete data backfills (scripts/backfill-tenant-scoped-tables.ts et al.)
- [ ] Enable MULTI_TENANCY_ENABLED in staging and monitor middleware logs for unresolved tenants or mismatches
  - Dep: Observability dashboards available (monitoring/)
- [ ] Add CI guard to fail on new PrismaClient instantiation in src (grep + eslint)
  - Dep: CI config picks up eslint errors

