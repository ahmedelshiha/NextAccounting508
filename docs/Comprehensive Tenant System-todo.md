
## AI Agent Update (2025-10-07)

### Deployment automation
- Added GitHub Actions workflow .github/workflows/tenant-migrations.yml to run the tenant migration runbook.
  - Triggers: manual (workflow_dispatch) or push to ai_main_df9a6d8380eb when secret AUTO_RUN_MIGRATIONS is set to '1'.
  - Requires repo secret: NETLIFY_DATABASE_URL (do NOT store credentials in code). Optionally set AUTO_RUN_MIGRATIONS='1' to allow push-triggered runs.
  - The job runs in the 'production' environment so you can enable required reviewers/approvals in GitHub to gate execution.
  - Recommended: keep AUTO_RUN_MIGRATIONS unset (or '0') and use manual dispatch for safety during rollout.


## ✅ Completed
- [x] Prepared runbook script to execute backfill and migrations locally
  - File: scripts/run-tenant-migrations.sh
  - Why: Consolidates steps into a single idempotent script for operator use
  - How to run: NETLIFY_DATABASE_URL="<conn>" ./scripts/run-tenant-migrations.sh

## ⚠️ Notes
- This script performs DDL/DML; ensure DB snapshot is taken before running and run in a maintenance window.
- The script is best-run from a CI or operator shell with pnpm and tsx available.


## ✅ Completed
- [x] Reloaded context and performed core tenancy audit (Prisma schema, middleware, tenant utilities, tenant guard)
  - **Why**: Establish a current, precise baseline to guide safe multi-tenant enhancements
  - **Impact**: Reduced risk of regressions; clear roadmap aligned with existing RLS and guard enforcement

## ⚠️ Issues / Risks
- MULTI_TENANCY_ENABLED must be explicitly set; ambiguous defaults can mask scope bugs
- Default-tenant auto-creation (resolveTenantId) in production may hide misrouted traffic; prefer explicit failure when MT is enabled
- RLS requires consistent withTenantRLS usage for raw queries; gaps can lead to cross-tenant reads/writes
- Some APIs may lack explicit tenantFilter/getResolvedTenantId usage; needs verification

## 🚧 In Progress
- [ ] Validate middleware tenant resolution paths (token vs subdomain), signed cookie issuance, and header propagation; define edge-case handling

## 🔧 Next Steps
- [ ] Enumerate all Prisma models with tenantId and verify unique indexes include tenant scope; propose fixes where missing
- [ ] Assess RLS coverage and tenantContext usage across services; ensure registerTenantGuard applies globally
- [ ] Audit API routes/services for tenantFilter/getResolvedTenantId usage; list and fix gaps with targeted PRs
- [ ] Add regression tests for: tenant header propagation, guard enforcement, and RLS via withTenantRLS
- [ ] Backfill/migration validation: run scripts against current schema and wire CI checks (non-destructive by default)
- [ ] Introduce strict mode when MULTI_TENANCY_ENABLED=true: error if tenant cannot be resolved instead of silently defaulting
