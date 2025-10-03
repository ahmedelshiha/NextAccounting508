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
- [ ] Implement `withTenantContext` API wrapper that enforces authentication, tenant signatures, and role-based access before invoking route handlers.
- [ ] Update high-risk admin routes (tasks, analytics, service requests, bookings, etc.) to use the wrapper and tenant repositories.
- [ ] Replace `findUnique({ where: { id } })` patterns with composite tenant-aware lookups.
- [ ] Ensure response payloads exclude data from other tenants and include tenant context where appropriate for auditing.
- [ ] Add consistent error handling for tenant mismatches, returning 403 Forbidden with structured error bodies.

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
- Fixed booking availability to query OrganizationSettings with `tenantId: svc.tenantId ?? undefined` and safely assign timezone.
✅ Why it was done: Enhancement/refactor to align all user lookups with `@@unique([tenantId, email])`, prevent cross-tenant leakage, and satisfy Prisma types; availability fix removes nullable tenantId in filters to satisfy Prisma’s `StringFilter` type.
✅ Next steps:
- Centralize tenant resolution and composite where builders in a shared util; refactor routes to use it.
- Add tests for tenant-scoped email uniqueness and timezone fallback in availability generation.
- Review remaining Prisma queries for potential `null` tenantId filters and replace with `undefined` where appropriate.
