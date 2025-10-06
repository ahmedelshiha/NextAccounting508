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
- [x] Session reload: validated presence of scripts/tenant-rls-utils.ts and adoption across maintenance scripts (e.g., assign-chatmessages-tenant-primary.ts) and confirmed API routes broadly use withTenantContext
  - **Why**: Maintain persistent state and ensure helpers are in place for RLS-safe script execution
  - **Impact**: Confident progression to rollout tasks with reduced regression risk
- [x] CI guard enforced by updating build script to run lint and typecheck
  - **Why**: Ensure all builds (not only vercel:build) fail on ESLint violations, including PrismaClient instantiation rule
  - **Impact**: Stronger pipeline enforcement; prevents insecure patterns from shipping
- [x] Fixed scripts/backfill-booking-tenantId.ts variable reference bugs
  - **Why**: Correctly reference processed booking id during backfill and logging
  - **Impact**: Reliable tenantId backfill, fewer runtime errors during maintenance
- [x] Fixed missing import in src/lib/db-raw.ts to correctly use withTenantRLS for tenant-scoped raw queries
  - **Why**: Ensure raw helpers run under RLS with proper tenant context
  - **Impact**: Prevents runtime/compile errors and enforces tenant isolation for raw SQL helpers
- [x] Removed duplicate import in scripts/tenant-rls-utils.ts
  - **Why**: Fix TypeScript compile error and keep utility clean
  - **Impact**: Scripts using RLS helpers compile reliably
- [x] Added npm script db:rls:auto for one-command staged rollout with verification
  - **Why**: Simplify operator workflow and reduce mistakes during rollout
  - **Impact**: Faster, safer deployments
- [x] Disabled Netlify E2E plugin and set RUN_E2E=false for production context
  - **Why**: Prevent E2E plugin from executing during Netlify builds
  - **Impact**: Shorter, more reliable builds; E2E can still be run manually when needed

- [x] Resolved duplicate 'withTenantRLS' import in src/lib/db-raw.ts causing TS2300 at lines 1 and 3
  - **Why**: Fix TypeScript duplicate identifier to unblock build
  - **Impact**: Build succeeds through typecheck; raw helpers remain tenant-scoped

- [x] Added GitHub Actions CI to run lint, typecheck, and build:skip-env on push/PR
  - **Why**: Ensure CI always runs the same checks as local/Vercel, without requiring secrets
  - **Impact**: Earlier failure detection; consistent quality gates across PRs and main

- [x] Migrated scripts/list_posts.ts to require tenant scope and run under runWithTenantRLSContext
  - **Why**: Make maintenance scripts safe under strict RLS and avoid cross-tenant reads
  - **Impact**: Scripts behave consistently when RLS is enforced; reduces leakage risk

- [x] RLS rollout runbook notes added (usage & rollback) to guide operators
  - **Why**: Provide clear operational steps for prepare/tighten/enforce and rollback
  - **Impact**: Safer rollouts; faster recoverability

- [x] Updated scripts/inspect-bookings.ts to optionally run tenant-scoped under RLS via runWithTenantRLSContext
  - **Why**: Allow safe per-tenant inspection under enforced RLS while retaining pre-RLS null-audit behavior
  - **Impact**: Flexible diagnostics in both pre- and post-RLS phases without cross-tenant leakage

## 📘 RLS Rollout Runbook (summary)
- Prepare: pnpm db:rls:auto --phase prepare --verify
- Tighten (after backfills and verification): RLS_ALLOW_NULL_TENANT=false pnpm db:rls:auto --phase tighten --verify
- Enforce (final): FORCE_RLS=true pnpm db:rls:auto --phase enforce --verify
- Rollback: Re-run previous phase with prior env flags (e.g., set RLS_ALLOW_NULL_TENANT=true to relax). Always take DB snapshots before phase changes.
- Verification checklist: admin APIs for bookings, services, tasks; portal SR flows; uploads AV callback; stats endpoints.

- [x] Fixed tenant resolution to accept slug or id and fallback safely in src/lib/default-tenant.ts
  - **Why**: After enabling tenant context, login failed because subdomain/header hints didn’t map to a real tenant id
  - **Impact**: Credentials login works on apex domains and unknown subdomains; strict mode still enforced when enabled

## ⚠️ Issues / Risks
- Any external Netlify functions or serverless contexts that create PrismaClient separately should be reviewed; grep for "new PrismaClient" if build starts failing due to ESLint rule.
- Some RLS policies in setup may still allow NULL when RLS_ALLOW_NULL_TENANT is left as default (true). Ensure to set to false after backfills.
- Remaining one-off maintenance scripts that update data across multiple tenants still depend on running before FORCE_RLS=true; migrate them to the new helper or execute under superuser credentials.

## 🚧 In Progress
- [ ] Stage RLS rollout
  - Prereq: Valid staging database snapshot/backups
  - Steps: Use `pnpm db:rls:auto` in staging; verify key endpoints between phases before advancing to FORCE_RLS

## 🔧 Next Steps
- [ ] Tighten RLS policies by setting RLS_ALLOW_NULL_TENANT=false in staging once backfills are complete, then re-run scripts/setup-rls.ts
- [ ] Enable MULTI_TENANCY_ENABLED in staging and monitor middleware logs for unresolved tenants or mismatches
- [ ] Migrate additional per-tenant scripts (e.g., report-tenant-null-counts.ts) to require tenant and use runWithTenantRLSContext where feasible
- [ ] Expand CI to include selected integration tests with PR label (optional)
