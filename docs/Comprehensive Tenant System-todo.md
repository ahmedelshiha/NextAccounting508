## Comprehensive Tenant System Audit — Initial Report (v1)

System overview
- Next.js + Prisma app with optional multi-tenancy flag (env MULTI_TENANCY_ENABLED).
- Tenancy inferred from header x-tenant-id, cookie/localStorage, or subdomain; prisma tenant guard + AsyncLocalStorage tenantContext exist; withTenantContext is used on some routes.
- Prisma schema includes Tenant and many tenantId columns (some nullable); settings models are unique per-tenant.

✅ Strengths
- Prisma: composite uniqueness like @@unique([tenantId, email]); many models indexed by tenantId; settings models (Organization/Integration/Communication/Security) have strict per-tenant uniqueness and relations.
- Protection: prisma registerTenantGuard enforces tenant context and blocks unsafe creates/bulk mutations; logs reads lacking tenant constraints.
- Context: withTenantContext wrapper establishes AsyncLocalStorage tenantContext; enforces auth and role checks; minimal tenant_sig cookie sanity check.
- Tooling: scripts/check_prisma_tenant_columns.js and scripts/check_tenant_scope.js provide DB checks and isolation smoke tests.
- Usage: Several admin routes already refactored to withTenantContext and getTenantFilter helpers.

⚠️ Gaps / Weaknesses
- Middleware security: src/app/middleware.ts forwards x-tenant-id from user-controlled cookie/localStorage/subdomain; does not strip untrusted headers nor verify against session; does not set tenantContext; does not set/verify HMAC-signed tenant cookies; does not cover /api in matcher.
- Header trust: Many API routes still use getTenantFromRequest + tenantFilter reading x-tenant-id; subject to header spoofing if any path bypasses the guard or runs raw queries.
- Partial adoption: withTenantContext not yet applied across all admin/portal routes; mixed patterns increase risk and complexity.
- Schema looseness: Several models keep tenantId nullable (ServiceRequest, Booking, Expense, etc.); Service has tenantId? with @@unique([tenantId, slug]) — nullable tenantId can create cross-tenant/global ambiguity and complicates constraints.
- No DB-level RLS: Isolation enforced in app only; Postgres RLS not enabled; no session variables set for DB policies.
- Client header injection: src/lib/api.ts injects x-tenant-id from cookie/localStorage on the client; src/components/admin/layout/TenantSwitcher writes tenant cookie directly; both allow user tampering.
- In-memory fallbacks: Some endpoints filter in-memory collections by tenant only when MULTI_TENANCY_ENABLED; off-by-flag logic can leak data in future refactors.

Risks
- Cross-tenant read/write via header/cookie tampering where routes still trust getTenantFromRequest and guard is not active (e.g., missing tenantContext or models with nullable tenantId).
- Runtime failures when MULTI_TENANCY_ENABLED=true on routes not wrapped by withTenantContext (tenant guard requires context and will throw).
- Data integrity drift due to nullable tenantId and lack of FK/compound FK constraints enforcing same-tenant relationships.

# Tenant System Audit TODO Update — Stages 1–3

## ✅ Completed
- [x] Stage 1 (P1): Portal core endpoints → withTenantContext
  - [x] src/app/api/portal/realtime/route.ts
  - [x] src/app/api/portal/settings/booking-preferences/route.ts
  - [x] src/app/api/portal/chat/route.ts
  - Impact: Consistent auth/tenant enforcement; safer SSE/chat; user-scoped prefs.
- [x] Stage 2 (P1): Portal service-requests foundation → withTenantContext
  - [x] src/app/api/portal/service-requests/route.ts
  - [x] src/app/api/portal/service-requests/availability/route.ts
  - [x] src/app/api/portal/service-requests/recurring/preview/route.ts
  - [x] src/app/api/portal/service-requests/export/route.ts
  - Impact: Tenant isolation for SR list/create/export and availability/recurrence planning.
- [x] Stage 3 (P1): Portal service-requests item subroutes → withTenantContext
  - [x] src/app/api/portal/service-requests/[id]/comments/route.ts
  - [x] src/app/api/portal/service-requests/[id]/confirm/route.ts
  - [x] src/app/api/portal/service-requests/[id]/reschedule/route.ts
  - Why: Remove header-based tenant checks and session duplication; enforce ownership and tenant match from context.
  - Impact: Commenting, confirmation, and rescheduling are tenant/owner-safe and aligned with Prisma guard.

## ⚠️ Issues / Risks
- Dev fallbacks require tenantId on mock data for accurate filtering after context migration.

## 🚧 In Progress
- None for portal routes; next phases move to payments/auth users endpoints.

## 🔧 Next Steps
- [ ] Stage 4: Other server routes (payments checkout, auth register, email test, users/me, bookings/**) → withTenantContext.
- [ ] Tests: add integration tests for SR comments/confirm/reschedule under tenant isolation and conflict handling.
- [ ] Observability: correlate requestId/userId/tenantId in logs for these routes and add Sentry tags.
