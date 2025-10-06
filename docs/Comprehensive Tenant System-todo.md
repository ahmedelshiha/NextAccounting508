## ✅ Completed
- [x] Introduced scripts/rls-rollout.ts orchestrator leveraging reusable setupTenantRLS to automate prepare/tighten/enforce phases with audits and safeguards
  - **Why**: Provide a single CLI to manage RLS rollout toggles safely, preventing accidental FORCE_RLS before data is clean
  - **Impact**: Streamlines staged rollout in staging/production, ensuring audits run before tightening policies
- [x] Added tenant-focused script utilities and enforced RLS context in critical maintenance flows (seed-tenant-defaults, chat message assignment, booking backfill)
  - **Why**: Ensure operational scripts and Netlify functions operate under explicit tenant scopes once RLS is forced
  - **Impact**: Prevents cross-tenant leakage during automation, keeps seeding and backfill jobs functional under strict RLS policies
- [x] Resolved ESLint flat config undefined entry causing Vercel build failures by removing stray array element in eslint.config.mjs
  - **Why**: Restore lint step reliability so automated builds complete without configuration errors
  - **Impact**: Lint and build pipelines run to completion, preventing deployment blockers
- [x] Context reloaded from docs/Comprehensive Tenant System-todo.md and repository; verified prisma-tenant-guard, middleware, RLS helpers, and API wrappers are implemented and consistent
  - **Why**: Establish accurate state and avoid re-analysis; ensure enforcement layers align
  - **Impact**: Safer autonomous execution and fewer regressions
- [x] Enforced shared Prisma client usage via ESLint rule to forbid direct PrismaClient instantiation (globally, excluding src/lib/prisma.ts)
  - **Why**: Ensure tenant guard middleware is always applied and cannot be bypassed across the codebase
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
- [x] Added RLS strict toggle to scripts/setup-rls.ts via RLS_ALLOW_NULL_TENANT=false to remove NULL allowance when desired
  - **Why**: Facilitate staged rollout from permissive to strict RLS
  - **Impact**: Safer migration path; easy switch to enforce full isolation once backfills complete
- [x] Refactored admin bookings API to scope by booking.tenantId instead of client.tenantId
  - **Why**: Booking already has tenantId; direct scoping is clearer and leverages indexes
  - **Impact**: Simpler queries, better performance, and stricter tenant isolation

## ⚠️ Issues / Risks
- Any external Netlify functions or serverless contexts that create PrismaClient separately should be reviewed; grep for "new PrismaClient" if build starts failing due to ESLint rule.
- Some RLS policies in setup may still allow NULL when RLS_ALLOW_NULL_TENANT is left as default (true). Ensure to set to false after backfills.
- Remaining one-off maintenance scripts that update data across multiple tenants still depend on running before FORCE_RLS=true; migrate them to the new helper or execute under superuser credentials.

## 🚧 In Progress
- [ ] Stage RLS rollout
  - Prereq: Valid staging database snapshot/backups
  - Steps: Use `pnpm tsx scripts/rls-rollout.ts --phase auto --verify` in staging; verify key endpoints between phases before advancing to FORCE_RLS

## 🔧 Next Steps
- [ ] Tighten RLS policies by setting RLS_ALLOW_NULL_TENANT=false in staging once backfills are complete, then re-run scripts/setup-rls.ts
- [ ] Enable MULTI_TENANCY_ENABLED in staging and monitor middleware logs for unresolved tenants or mismatches
- [ ] Add CI guard to fail on new PrismaClient instantiation (eslint already added; ensure CI runs lint)
- [ ] Roll new tenant RLS script helper across remaining data repair scripts that still rely on unrestricted Prisma access
- [ ] Capture operational runbook entry covering scripts/rls-rollout.ts usage and rollback plan
