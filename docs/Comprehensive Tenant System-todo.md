## ✅ Completed
- [x] Context reloaded from docs/Comprehensive Tenant System-todo.md and repository; verified prisma-tenant-guard, middleware, RLS helpers, and API wrappers are implemented and consistent
  - **Why**: Establish accurate state and avoid re-analysis; ensure enforcement layers align
  - **Impact**: Safer autonomous execution and fewer regressions
- [x] Enforced shared Prisma client usage via ESLint rule to forbid direct PrismaClient instantiation in src (except src/lib/prisma.ts)
  - **Why**: Ensure tenant guard middleware is always applied and cannot be bypassed
  - **Impact**: Prevents accidental cross-tenant access via ad-hoc clients; improves maintainability
- [x] Migrated create_jwt_session to TypeScript using shared prisma and tenant-aware token fields
  - **Why**: Prevent bypassing tenant guard and produce dev JWTs compatible with middleware expectations
  - **Impact**: Consistent local tooling; reduced risk of cross-tenant access during scripting
- [x] Added unit tests for RLS helpers (withTenantRLS and setTenantRLSOnTx)
  - **Why**: Assert session tenant variable is set for RLS-protected queries
  - **Impact**: Early detection of regressions in RLS context propagation
- [x] Reviewed Netlify functions for shared prisma and raw SQL usage
  - **What**: cron-payments-reconcile uses shared prisma; cron-reminders and health-monitor use fetch; run-tenant-migrations and seed-tenant-defaults use pg Client by design
  - **Impact**: Confirms tenant guard coverage where Prisma is used; migrations/seeds are isolated
- [x] Enabled MULTI_TENANCY_ENABLED=true in local dev environment
  - **Why**: Exercise tenant guard and middleware paths locally
  - **Impact**: Early detection of missing tenant context in development

## ⚠️ Issues / Risks
- Any external Netlify functions or serverless contexts that create PrismaClient separately should be reviewed; grep for "new PrismaClient" in non-scripts folders if needed.
- Some RLS policies in scripts/setup-rls.ts allow tenantId IS NULL for transitional safety. Plan a follow-up tightening pass after all backfills enforce NOT NULL where intended.

## 🚧 In Progress
- [ ] Stage RLS rollout
  - Prereq: Valid staging database snapshot/backups
  - Steps: Run scripts/setup-rls.ts with FORCE_RLS=false; verify key endpoints; then enable FORCE_RLS=true in staging and re-verify
- [ ] Audit raw SQL and transactions
  - Scope: netlify/functions/** and scripts/** using $queryRaw/$executeRaw
  - Action: Ensure withTenantRLS or setTenantRLSOnTx is applied where appropriate (API routes already enforced by ESLint)

## 🔧 Next Steps
- [ ] Tighten RLS policies by removing "OR tenantId IS NULL" once all backfills are complete and affected tables enforce NOT NULL
  - Dep: Complete data backfills (scripts/backfill-tenant-scoped-tables.ts et al.)
- [ ] Enable MULTI_TENANCY_ENABLED in staging and monitor middleware logs for unresolved tenants or mismatches
  - Dep: Observability dashboards available (monitoring/)
- [ ] Add CI guard to fail on new PrismaClient instantiation in src (grep + eslint)
  - Dep: CI config picks up eslint errors
- [ ] Review remaining scripts for direct PrismaClient usage and convert to shared client or TS runner where feasible
