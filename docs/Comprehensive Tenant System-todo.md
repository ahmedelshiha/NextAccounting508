
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
