
## ✅ Completed
- [x] Enumerated Prisma models containing tenantId and reviewed tenant-scoped unique/index constraints
  - **Why**: Ensure tenant isolation is enforced at the data layer and unique constraints do not leak across tenants
  - **Impact**: Identified models with safe tenant-scoped uniques and flagged global uniques that likely need tenant scoping

### Summary of findings
- Models with tenantId present (non-exhaustive list):
  - User — @@unique([tenantId, email]) ✅
  - TenantMembership — @@unique([userId, tenantId]) ✅
  - Service — @@unique([tenantId, slug]) ✅
  - ServiceView — tenantId optional (tenantId is nullable)
  - Booking — tenantId present, indexed ✅
  - ServiceRequest — tenantId present, indexed ✅
  - Task, ComplianceRecord, ScheduledReminder, Attachment, WorkOrder, Invoice, Expense, ChatMessage, IdempotencyKey, BookingSettings, OrganizationSettings, IntegrationSettings, CommunicationSettings, SecuritySettings — all include tenantId or tenantId unique/indexed (see detailed notes below)

### Items requiring attention (recommendations)
- Invoice.number is currently global-unique (@unique). Recommendation: make invoice numbers tenant-scoped by converting to @@unique([tenantId, number]) to avoid cross-tenant collisions when invoice numbering is per-tenant.
- WorkOrder.code is globally @unique. If work order codes should be unique within a tenant only, change to @@unique([tenantId, code]). If codes must be global, leave as-is and document the requirement.
- Attachment.key is @unique. If keys are generated per-tenant (e.g., 'tenantId/path'), consider scoping to tenant to allow same key namespaces across tenants or ensure key generation includes tenantId.
- Newsletter.email is @unique globally. If newsletters are tenant-specific, consider scoping to tenantId; if managed centrally (single newsletter list), global unique may be intended.
- User.employeeId is @unique globally. If employee IDs are tenant-scoped, convert to @@unique([tenantId, employeeId]). If the organization uses a global employee registry, keep as-is.

### Safe/intentional global uniques observed
- Tenant.slug and Tenant.primaryDomain are global uniques by design (tenants must have unique slugs/domains).
- ServiceRequest.paymentSessionId and Account provider/providerAccountId are global uniques (external payment/session/provider IDs are globally unique by provider).

### Actions recommended
- For each flagged global unique (Invoice.number, WorkOrder.code, Attachment.key, Newsletter.email, User.employeeId): confirm intended uniqueness scope with product/ops. If per-tenant uniqueness is desired, prepare non-destructive migration SQL to add tenant-scoped unique constraints and drop global ones after verification.
- Add unit/regression tests verifying that tenant-scoped unique constraints behave correctly and that tenant-guard prevents cross-tenant mutation/reads.

## ✅ Completed (code)
- [x] Introduced optional strict tenant resolution mode
  - **Why**: Allow enforcing that tenant must be explicitly resolved when multi-tenancy is enabled to avoid silent defaulting to a 'primary' tenant in production.
  - **How**: Added MULTI_TENANCY_STRICT env var. When MULTI_TENANCY_ENABLED=true and MULTI_TENANCY_STRICT=true, resolveTenantId() throws when no tenant hint is provided. Default behavior remains backwards-compatible (legacy default tenant creation) when MULTI_TENANCY_STRICT is unset or false.
  - **Files changed**: src/lib/default-tenant.ts

## 🚧 In Progress
- [ ] Validate middleware tenant resolution paths (token vs subdomain), signed cookie issuance, and header propagation; define edge-case handling

## 🔧 Next Steps
- [ ] Assess RLS coverage and tenantContext usage across services; ensure registerTenantGuard applies globally
- [ ] Audit API routes/services for tenantFilter/getResolvedTenantId usage; list and fix gaps with targeted PRs
- [ ] Add regression tests for: tenant header propagation, guard enforcement, and RLS via withTenantRLS
- [ ] Backfill/migration validation: run scripts against current schema and wire CI checks (non-destructive by default)
- [ ] When ready, enable MULTI_TENANCY_STRICT=true in staging to validate behavior before enabling in production
