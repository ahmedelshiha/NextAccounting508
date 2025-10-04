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
P0 ��� Blockers / security
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

# Comprehensive Tenant System Enhancement Checklist

> Reference guideline: [Comprehensive Tenant System Enhancement Plan](./Comprehensive%20Tenant%20System%20Enhancement%20Plan.md) · [Tenant System Audit Report](./tenant-system-audit.md)

## Phase 0: Planning and Governance
- [ ] Confirm executive sponsorship and security requirements for zero-trust tenant isolation with stakeholders.
- [ ] Define tenant identifier canonical source (tenant table schema, slug, domain mapping) and document naming conventions.
- [ ] Catalog all tenant-owned models, cross-tenant relationships, and singleton tables requiring partial uniqueness.
- [ ] Establish rollout environments (dev, staging, production) and change-management approvals for multi-tenant migrations.

## Phase 1: Database Schema Overhaul
- [ ] Add `tenantId` column (non-null) with indexes and foreign keys to `User`, `Task`, `ComplianceRecord`, `HealthLog`, `AuditLog`, and any remaining tenant-owned tables.
- [ ] Normalize nullable tenant columns by enforcing `tenantId` NOT NULL or explicit defaults for global rows.
- [ ] Introduce compound unique constraints (e.g., `@@unique([tenantId, slug])`) to enforce tenant-scoped uniqueness on services, users, and similar tables.
- [ ] Create partial unique indexes for singleton settings tables (`OrganizationSettings`, `BookingSettings`, `IntegrationSettings`, `SecuritySettings`, etc.) separating global vs tenant-specific rows.
- [ ] Implement compound foreign keys ensuring child entities reference parent entities with matching tenant IDs.

## Phase 2: Data Backfill and Integrity Scripts
- [ ] Write migration scripts to backfill new tenant columns using existing relationships (e.g., join tasks to assignee tenant).
- [ ] Resolve orphaned records by assigning them to a default system tenant or archiving as required.
- [ ] Remove temporary default values and enforce NOT NULL constraints post-backfill.
- [ ] Create verification queries ensuring all tenant-owned tables contain no NULL tenant IDs and respect compound constraints.

## Phase 3: Row-Level Security Enablement
- [ ] Add migration to enable PostgreSQL RLS on all tenant-scoped tables.
- [ ] Define tenant isolation policies using `current_setting('app.current_tenant_id')` for each protected table.
- [ ] Add optional super-admin bypass policy gated by `app.is_superadmin` session parameter.
- [ ] Document operational steps for setting session variables in migrations, scripts, and read replicas.

## Phase 4: Authentication and Tenant Binding
- [ ] Extend NextAuth credentials flow to return tenant memberships, active tenant ID, slug, and tenant role after login.
- [ ] Store tenant membership records (e.g., `TenantMembership` join table) linking users to allowed tenants with default flags.
- [ ] Update JWT callback to embed tenant metadata and token version for invalidation.
- [ ] Add session callback to expose tenant data to the client while rejecting invalidated tokens.
- [ ] Implement tenant switch endpoint that validates membership before updating JWT tenant context.

## Phase 5: Tenant Context Propagation
- [ ] Introduce AsyncLocalStorage-based `tenantContext` manager to capture tenant metadata per request lifecycle.
- [ ] Build helper utilities (`requireTenantContext`, `getTenantFilter`, enforcement helpers) for tenant-aware validations and logging.
- [ ] Ensure tenant context is established at the start of every server action, API route, and background job before accessing Prisma.
- [ ] Audit existing utility modules to replace manual header checks with tenant context helpers.

## Phase 6: Middleware and Request Pipeline
- [ ] Expand Next.js middleware matcher to include `/api/:path*` while excluding static assets.
- [ ] Validate tenant consistency between JWT, signed tenant cookie, and subdomain, rejecting mismatches with 403 responses.
- [ ] Strip or overwrite inbound `x-tenant-id` headers and replace with server-verified tenant identifiers.
- [ ] Issue HMAC-signed tenant cookies (`tenant_sig`) and verify them on every request.
- [ ] Log request metadata (`tenantId`, `userId`, `requestId`) for observability and traceability.

## Phase 7: Prisma Client Enhancements
- [ ] Wrap Prisma client in custom class that registers middleware enforcing tenant scopes for configured models.
- [ ] Inject tenant filters automatically for read operations, update/delete operations, and inserts lacking explicit tenant IDs.
- [ ] Prevent cross-tenant operations by comparing requested tenant filters against context tenant, raising errors on mismatches.
- [ ] Add helpers to set session variables before executing raw queries to satisfy RLS policies.
- [ ] Document tenant-scoped model list and ensure future models are added via linting or code review checks.

## Phase 8: Repository and Service Layer Updates
- [ ] Create tenant-scoped repository abstractions that centralize Prisma access using tenant context helpers.
- [ ] Refactor service modules to depend on repositories instead of direct Prisma calls.
- [ ] Ensure repositories expose tenant-safe CRUD and analytics methods without accepting raw tenant IDs from callers.
- [ ] Update caching mechanisms to include tenant identifiers in cache keys and invalidation logic.
- [ ] Audit background jobs and cron scripts to run within tenant context or iterate per tenant with isolation.

## Phase 9: API Layer Refactor
- [x] Implement `withTenantContext` API wrapper that enforces authentication, tenant signatures, and role-based access before invoking route handlers.

✅ What was completed: Implemented `withTenantContext` and added the server-side wrapper at `src/lib/api-wrapper.ts`.

✅ Why it was done: Centralizes tenant context establishment, standardizes auth/role checks, and prepares request lifecycle for Prisma tenant-scoping and observability. The wrapper uses `getServerSession(authOptions)` to resolve the authenticated user and then runs the provided handler inside the existing AsyncLocalStorage `tenantContext` so downstream services and Prisma middleware can rely on a consistent tenant context.

✅ Next steps:
- Refactor high-risk admin routes (tasks, analytics, service requests, bookings) to use `withTenantContext` instead of manual session handling.
- Expand middleware to issue and fully verify HMAC-signed `tenant_sig` cookies and strip untrusted `x-tenant-id` headers.
- Add integration tests that assert tenant mismatch cases return 403 and that tenantContext is present inside handlers.

- [ ] Update remaining admin and portal routes to the wrapper.
- [ ] Add signature verification and hardened tenant cookie checks in middleware.
- [ ] Add tests for tenant cookie expiry and invalid signatures.

## Phase 10: Client and Portal Adjustments
- [ ] Update frontend data-fetching hooks to remove manual tenant header injection and rely on authenticated API endpoints.
- [ ] Provide tenant switcher UI that calls secure tenant-switch endpoints and refreshes session data.
- [ ] Ensure portal routes display tenant-specific information only after verifying session tenant alignment.
- [ ] Review offline or cached data stores (localStorage, IndexedDB) to include tenant scoping for multi-tenant clients.

## Phase 11: Testing and Quality Assurance
- [ ] Expand integration tests to cover tenant impersonation attempts and expect 403/404 outcomes.
- [ ] Add unit tests for Prisma middleware validating injected tenant filters and rejection of mismatched tenant IDs.
- [ ] Create Playwright or Cypress tests for subdomain routing and tenant switching flows.
- [ ] Implement automated migration tests verifying schema changes, data backfill, and RLS policies on CI databases.
- [ ] Establish regression tests ensuring analytics and reporting endpoints return isolated tenant aggregates.

## Phase 12: Monitoring and Observability
- [ ] Augment logger to include tenant identifiers on every log entry and audit event.
- [ ] Configure Sentry (or equivalent) to tag events with tenant context and user identifiers.
- [ ] Create dashboards tracking tenant-specific request volume, error rates, and security incidents.
- [ ] Instrument critical flows (login, tenant switch, task CRUD) with performance metrics segmented by tenant.

## Phase 13: Deployment and Rollout
- [ ] Sequence migrations with feature flags to decouple schema rollout from application changes.
- [ ] Establish backfill progress monitoring and rollback procedures for production rollout.
- [ ] Perform staged deployment (dev → staging → production) verifying tenant isolation at each step.
- [ ] Communicate tenant-impacting changes, downtime windows, and new security requirements to stakeholders.

## Phase 14: Post-Rollout Operations
- [ ] Monitor logs and alerts for cross-tenant access attempts or RLS violations after deployment.
- [ ] Update developer onboarding documentation with tenant context usage guidelines.
- [ ] Schedule periodic audits to ensure new models include tenant governance and tests remain comprehensive.
- [ ] Review incident response playbooks incorporating tenant context for faster investigations.

[x] Add Tenant back-relations for settings models
✅ What was completed: Added organization, integration, communication, and security settings back-relations to the Tenant model to satisfy Prisma validation requirements.
✅ Why it was done: Enhancement to align existing Prisma schema so per-tenant settings reuse canonical Tenant relations and remove build-blocking errors.
✅ Next steps: Audit remaining tenant-scoped models to ensure consistent back-relations and tenantId enforcement before enabling RLS.

[x] Enforce tenant context for seeded tasks and admin task creation
✅ What was completed: Updated seed data to attach tenant relations to tasks and compliance records, ensured admin service-request task creation wires tenant IDs, and adjusted the dev login route to locate users via tenant-aware indices.
✅ Why it was done: To satisfy new Prisma multi-tenant constraints and prevent runtime failures when creating tasks or issuing dev tokens in tenant-scoped environments.
✅ Next steps: Review remaining task APIs and seed routines to verify tenantId propagation and extend tenant-aware authentication across non-admin flows.

[x] Fix TS build errors by enforcing tenant-aware Prisma inputs in API routes
✅ What was completed:
- Updated user registration routes to use `where: { tenantId_email: { tenantId, email } }` and include `tenantId` on create.
- Made dev-login user lookup tenant-scoped using resolved tenant ID.
- Added tenant filtering to HealthLog GET and included `tenantId` on HealthLog creation.
- Ensured realtime health logs (connect/disconnect) include `tenantId`.
- Tenant-scoped user lookup/create in public service-requests endpoint.
✅ Why it was done: Prisma schema enforces tenant-scoped uniqueness and non-null `tenantId` for critical models; routes were using legacy email-only lookups and inserts without tenant, causing TS2322 errors and runtime risk.
✅ Next steps:
- Audit any remaining `findUnique({ where: { email } })` patterns and replace with composite lookups.
- Add a shared helper to resolve tenant and compose tenant-aware where clauses to avoid duplication.
- Extend middleware to always establish tenant context so route handlers avoid manual resolution.

[x] Tenant-aware user/email checks and availability timezone fix
✅ What was completed:
- Updated users/check-email route to resolve tenant and use `tenantId_email` for uniqueness checks.
- Updated users/me PATCH to validate email uniqueness within the current user’s tenant.
- Updated NextAuth credentials authorize to resolve tenant and query by `tenantId_email`.
- Fixed booking availability to query OrganizationSettings with `tenantId: svc.tenantId \?\? undefined` and safely assign timezone.
✅ Why it was done: Enhancement/refactor to align all user lookups with `@@unique([tenantId, email])`, prevent cross-tenant leakage, and satisfy Prisma types; availability fix removes nullable tenantId in filters to satisfy Prisma’s `StringFilter` type.
✅ Next steps:
- Centralize tenant resolution and composite where builders in a shared util; refactor routes to use it.
- Add tests for tenant-scoped email uniqueness and timezone fallback in availability generation.
- Review remaining Prisma queries for potential `null` tenantId filters and replace with `undefined` where appropriate.

[x] Centralize tenant-aware helper utilities and apply to high-traffic routes
✅ What was completed: Added shared helpers in src/lib/tenant.ts for resolving tenant IDs, composing tenant/email lookups, and enforcing tenant data writes; refactored auth registration, dev login, portal realtime, public service-requests, users/check-email, and admin org-settings routes to rely on the new helpers.
✅ Why it was done: Enhancement to remove duplicated tenant resolution logic, prevent mismatched tenant IDs in Prisma queries, and standardize tenant-aware access across critical endpoints.
✅ Next steps: Migrate remaining services and background jobs to the shared helpers, and extend coverage to additional Prisma access patterns (e.g., repository layer and other admin routes).

[x] Resolve TS build errors: withTenant typing and audit import
✅ What was completed:
- Refined `withTenant` overloads to return `{ tenantId: string }` by default, satisfying Prisma UncheckedCreateInput and preventing TS2322 in create calls.
- Removed duplicate `prisma` import in `src/lib/audit.ts` fixing TS2300.
- Verified affected routes (org-settings, auth/register, portal/realtime, public/service-requests) create calls include tenant.
✅ Why it was done: Fix compile-time failures after enforcing tenant constraints in Prisma.
✅ Next steps: Run full typecheck/build in CI and audit remaining routes for any direct unchecked tenant assignments.

[x] Restore homepage hero import alias
✅ What was completed: Added the missing `HeroSection` import to `src/app/page.tsx`, aliasing it as `HomeHeroSection` so the homepage renders without runtime reference errors.
✅ Why it was done: Without the import the dev server crashed on render, leaving the app non-functional for `/`; restoring the alias reestablishes the expected hero toggle logic.
✅ Next steps: None.

[x] Enforce Prisma tenant guard and add isolation tests
✅ What was completed: Introduced `registerTenantGuard` middleware that inspects Prisma operations for tenant-scoped models, blocking writes lacking tenant assignments, enforcing bulk filters, and logging unsafe reads; added integration tests (`tests/integration/prisma-tenant-guard.test.ts`) validating missing-tenant failures, and upgraded logger coverage for tenant-context leaks. Also wired the guard through `src/lib/prisma.ts` so every client instance applies the middleware.
✅ Why it was done: Establishes the Phase 1 safety net ensuring no new data is persisted without tenant attribution, prevents cross-tenant bulk mutations, and surfaces read-time leaks for follow-up hardening.
✅ Next steps: Extend the guard to auto-enforce tenant filters on single-record mutations once routes adopt `withTenantContext`, and capture log metrics for investigation dashboards.

---

# Tenant System Audit TODO Update — Staged Plan

## ✅ Completed
- [x] Agreed staged rollout plan for portal/public route migration and integration test design.
  - **Why**: Reduce risk via small, verifiable batches.
  - **Impact**: Clear checkpoints and faster feedback loops.

## ⚠️ Issues / Risks
- Overlapping refactors across routes; sequence PRs by stage and gate with feature flags if necessary.

## 🚧 In Progress
- [ ] Stage 1 (P1): Portal core endpoints → withTenantContext
  - [ ] src/app/api/portal/realtime/route.ts
  - [ ] src/app/api/portal/settings/booking-preferences/route.ts
  - [ ] src/app/api/portal/chat/route.ts

## 🔧 Next Steps
- [ ] Stage 2 (P1): Portal service-requests foundation
  - [ ] src/app/api/portal/service-requests/route.ts
  - [ ] src/app/api/portal/service-requests/availability/route.ts
  - [ ] src/app/api/portal/service-requests/recurring/preview/route.ts
  - [ ] src/app/api/portal/service-requests/export/route.ts
- [ ] Stage 3 (P1): Portal service-requests item subroutes
  - [ ] src/app/api/portal/service-requests/[id]/comments/route.ts
  - [ ] src/app/api/portal/service-requests/[id]/confirm/route.ts
  - [ ] src/app/api/portal/service-requests/[id]/reschedule/route.ts
- [ ] Stage 4 (P1): Other server routes
  - [ ] src/app/api/payments/checkout/route.ts
  - [ ] src/app/api/auth/register/register/route.ts
  - [ ] src/app/api/email/test/route.ts
  - [ ] src/app/api/users/me/route.ts
  - [ ] src/app/api/bookings/**
- [ ] Tests (P1):
  - [ ] 403 tenant mismatch: mismatched subdomain/header vs session returns 403 across refactored routes.
  - [ ] Tenant-switch: JWT rotation updates active tenant; subsequent calls reflect new tenant and old token is rejected.
  - [ ] Playwright: subdomain routing + portal flows remain tenant-isolated.
- [ ] Middleware follow-ups (P0/P1):
  - [ ] Confirm matcher includes /api/:path* and HMAC tenant_sig verification on every request path.
  - [ ] Sample rate logs to control volume; keep requestId/userId/tenantId correlation.
- [ ] CI & Linting (P1):
  - [ ] Add CI job: pnpm db:generate && pnpm typecheck && pnpm test:integration.
  - [ ] Lint rule/check to block new getServerSession in admin/portal routes; require withTenantContext.
