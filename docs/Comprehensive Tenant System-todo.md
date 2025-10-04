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

✅ Observed completed items (from code)
- registerTenantGuard in src/lib/prisma.ts with enforceTenantGuard in src/lib/prisma-tenant-guard.ts.
- AsyncLocalStorage tenantContext in src/lib/tenant-context.ts.
- withTenantContext in src/lib/api-wrapper.ts; applied to several admin routes (services, tasks, service-requests).
- Prisma schema with composite uniques (users tenantId+email) and per-tenant settings models.
- Scripts for checks and smoke testing.

🚧 Partial/in-progress
- Mixed route patterns: many endpoints still reading x-tenant-id header directly and gating with isMultiTenancyEnabled.
- Middleware lacks signed cookie issuance/verification and does not include /api.
- Minimal cookie sanity check exists in withTenantContext but not cryptographically verified.

🔧 Next steps (actionable)
P0 — Blockers / security
- [x] Harden middleware:
  - [x] Strip incoming x-tenant-id and x-tenant-slug from requests; set server-verified headers only.
  - [x] Issue and verify HMAC-signed tenant cookie (tenant_sig) using NEXTAUTH_SECRET; reject mismatches.
  - [x] Extend matcher to include /api/:path* and exclude only static assets.
  - [ ] Log requestId, userId, tenantId for every request.
- [x] Remove client-side tenant injection or restrict to development:
  - [x] Update src/lib/api.ts to stop setting x-tenant-id from cookie/LS in production.
  - [x] Replace TenantSwitcher with a secure tenant-switch endpoint that updates session (JWT) after membership validation.
- [ ] Adopt withTenantContext everywhere on admin/portal APIs and remove getTenantFromRequest trust. Representative targets (non-exhaustive):
  - [ ] src/app/api/admin/availability-slots/route.ts
  - [ ] src/app/api/admin/tasks/templates/**
  - [ ] src/app/api/admin/tasks/notifications/route.ts
  - [ ] src/app/api/admin/export/route.ts
  - [ ] src/app/api/admin/stats/** (bookings, users, posts)
  - [ ] src/app/api/admin/team-management/**
  - [ ] src/app/api/admin/expenses/route.ts
  - [ ] src/app/api/portal/service-requests/**
  - [ ] src/app/api/posts/**
  - [ ] src/app/api/services/**
- [ ] Add integration tests asserting 403 on tenant mismatch header/subdomain vs session.

Notes on work done:
- Middleware updated in src/app/middleware.ts to strip untrusted tenant headers and prefer tenant derived from authenticated token or subdomain. It issues a signed tenant_sig cookie for authenticated requests.
- Tenant cookie utilities added at src/lib/tenant-cookie.ts (HMAC sign/verify).
- API wrapper (src/lib/api-wrapper.ts) now verifies tenant_sig using cryptographic verification.
- Tenant switch endpoint implemented at src/app/api/tenant/switch/route.ts which validates membership and rotates the NextAuth JWT by encoding a new token and setting the session cookie.
- TenantSwitcher UI updated to call the secure tenant-switch endpoint and fallback to local cookie behavior if the endpoint fails.

Impact: These changes close immediate header spoofing attack vectors and provide a secure server-driven tenant switch mechanism. Remaining tasks: logging and removing client-side header injection in production.

P1 — Data integrity
- [ ] Schema tighten: make tenantId NOT NULL for tenant-owned tables (Service, ServiceRequest, Booking, Expense, etc.) unless explicitly global; add defaults/backfill migrations.
- [ ] Add composite FKs to enforce same-tenant relationships (e.g., Booking (serviceId, tenantId) → Service (id, tenantId)).
- [ ] Add partial unique indexes for global-vs-tenant singletons where applicable.
- [ ] Backfill scripts and verification queries; remove temporary NULL allowances.

P1 — DB enforcement
- [ ] Enable Postgres RLS on tenant-scoped tables; implement USING policies with current_setting('app.current_tenant_id').
- [ ] Add prisma helpers to SET LOCAL app.current_tenant_id per request for raw queries.
- [ ] Optional super-admin bypass via session parameter app.is_superadmin.

P1 — Observability & QA
- [ ] Tag logs and Sentry with tenant_id and tenant_slug; add dashboards for tenant isolation metrics.
- [ ] CI: run scripts/check_prisma_tenant_columns.js and a tenant isolation smoke test against preview env.
- [ ] Tests: unit tests for tenant-utils and prisma-tenant-guard; e2e subdomain/tenant-switch flows.

Owner assignments (proposed)
- Middleware hardening: Platform/Auth
- Route refactor: API team
- Schema + RLS: DB team
- Tests + CI: QA/Platform

Enforcement map (current)
- DB: RLS — not enabled.
- ORM: Prisma tenant guard — present, requires tenantContext; logs/blocks unsafe ops.
- API: withTenantContext — partial adoption.
- Middleware: auth/RBAC routing only; header forwarding; no signature verification; not applied to /api.
- Client: injects x-tenant-id from cookie/LS (unsafe in production).

# Tenant System Audit TODO Update — Stage 1 & 2

## ✅ Completed
- [x] Stage 1 (P1): Portal core endpoints → withTenantContext
  - [x] src/app/api/portal/realtime/route.ts
  - [x] src/app/api/portal/settings/booking-preferences/route.ts
  - [x] src/app/api/portal/chat/route.ts
  - **Why**: Eliminate header-based tenant trust and standardize tenant context across portal core APIs.
  - **Impact**: Consistent auth/tenant enforcement, safer SSE and chat flows, user-scoped preferences without session re-resolution.
- [x] Stage 2 (P1): Portal service-requests foundation → withTenantContext
  - [x] src/app/api/portal/service-requests/route.ts
  - [x] src/app/api/portal/service-requests/availability/route.ts
  - [x] src/app/api/portal/service-requests/recurring/preview/route.ts
  - [x] src/app/api/portal/service-requests/export/route.ts
  - **Why**: Remove getServerSession/getTenantFromRequest patterns; ensure tenant-scoped reads/creates/exports and availability checks.
  - **Impact**: Tenant isolation enforced for portal SR list/create/export and availability/recurrence planning.

## ⚠️ Issues / Risks
- Dev-fallback paths now filter strictly by ctx.tenantId; ensure test data includes tenantId to avoid confusion in single-tenant dev.

## 🚧 In Progress
- [ ] Stage 3 (P1): Portal service-requests item subroutes
  - [ ] src/app/api/portal/service-requests/[id]/comments/route.ts
  - [ ] src/app/api/portal/service-requests/[id]/confirm/route.ts
  - [ ] src/app/api/portal/service-requests/[id]/reschedule/route.ts

## 🔧 Next Steps
- [ ] Implement Stage 3 subroutes migration to withTenantContext and add ensure-ownership checks via requireTenantContext.
- [ ] Add integration tests: SR list/create/export and availability under tenant isolation; recurrence preview respects tenant.
- [ ] Confirm admin parity for SR analytics/bulk endpoints already migrated.
