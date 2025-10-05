# Tenant System Migration - AI Agent TODO

**Version:** 5.0 | **Updated:** 2025-10-05  
**Mission:** Harden and complete multi-tenant isolation across middleware, API, Prisma schema, RLS, and tests.  
**Timeline:** 12 weeks | **Phase:** 1 (100%)

---

## CRITICAL METRICS
- Routes Migrated to withTenantContext: 150/150 (100%) [GREEN]
- Tenant Isolation Incidents: 0/0 (100%) [GREEN]
- Tenant-mismatch Tests: 10/10 (100%) [GREEN]
- Nullable tenantId models remaining: 9 (target: 0) [YELLOW]
- RLS Policies Enabled: partial (script ready; rollout pending) [YELLOW]
- Prisma Tenant Guard Coverage (critical models): 100% [GREEN]

Validation shortcuts:
- pnpm lint && pnpm typecheck
- pnpm test && pnpm test:integration
- node scripts/check_prisma_tenant_columns.js
- TARGET_URL=https://staging.example.com AUTH_TOKEN=... node scripts/check_tenant_scope.js

---

## IMMEDIATE ACTIONS
1) Task 2.1: Apply NOT NULL tenantId migrations on remaining 9 models (P1, High)  
2) Task 4.1: Enable and verify RLS policies via script (P1, High)  
3) Task 12.1: Add remaining tenant-mismatch integration tests for cookie/header and subdomain flows (P1)  
4) Task 5.1: Finalize NextAuth tenant membership/session metadata rollout (P1)  
5) Task 9.1: Establish tenant-scoped repositories and refactor services to use them (P1)

---

## ACTIVE TASKS (Prioritized P0 → P1 → P2)

### P0 (Critical)
- No open P0 tasks (Phase 1 completed). Continue with P1 hardening.

### P1 (High)

#### Task 2.1: Add tenantId column and enforce NOT NULL (IN PROGRESS)
- Priority: P1 | Effort: 5d | Deadline: 2025-11-01  
- Status: Prepared migrations; application pending
- Dependencies:
  - Verified DB backup before modifications
  - Backfill scripts yielding zero unresolved NULLs per table
  - Migration order adherence (see below)
- Apply order (recommended):
  1) services  
  2) ServiceRequest  
  3) bookings  
  4) WorkOrder  
  5) invoices  
  6) expenses  
  7) ScheduledReminder  
  8) booking_settings  
  9) IdempotencyKey
- Backfill notes:
  - Bookings: COALESCE(user.tenantId, serviceRequest.tenantId, service.tenantId)
  - ServiceRequest: COALESCE(user.tenantId, service.tenantId)
  - WorkOrder: COALESCE(serviceRequest.tenantId, booking.tenantId, user.tenantId, service.tenantId)
  - Invoices: COALESCE(booking.tenantId, user.tenantId)
  - Expenses: user.tenantId
  - ScheduledReminder: serviceRequest.tenantId
- Execution script:
```bash
set -euo pipefail
export DATABASE_URL=${DATABASE_URL:?set DATABASE_URL}
# 0) Pre-checks
node scripts/report-tenant-null-counts.ts || true

# 1) Backfill pass (idempotent; re-run if needed)
pnpm tsx scripts/backfill-tenant-scoped-tables.ts
node scripts/report-tenant-null-counts.ts

# 2) Apply each migration in order (stop on first failure)
apply() { pnpm tsx scripts/apply-migration-file.ts "$1"; }
apply prisma/migrations/20251004_add_service_tenantid_not_null/migration.sql
apply prisma/migrations/20251004_add_servicerequest_tenantid_not_null/migration.sql
apply prisma/migrations/20251004_add_booking_tenantid_not_null/migration.sql
apply prisma/migrations/20251004_add_workorder_tenantid_not_null/migration.sql
apply prisma/migrations/20251004_add_invoice_tenantid_not_null/migration.sql
apply prisma/migrations/20251004_add_expense_tenantid_not_null/migration.sql
apply prisma/migrations/20251004_add_scheduledreminder_tenantid_not_null/migration.sql
apply prisma/migrations/20251004_add_bookingsettings_tenantid_not_null/migration.sql
apply prisma/migrations/20251004_add_idempotencykey_tenantid_not_null/migration.sql

# 3) Post-verify
node scripts/report-tenant-null-counts.ts
pnpm db:generate && pnpm typecheck && pnpm test
```
- Validation:
```bash
# Expect zero NULL tenantId rows post-migration
psql "$DATABASE_URL" -c "SELECT 'ServiceRequest', COUNT(*) FROM \"ServiceRequest\" WHERE \"tenantId\" IS NULL
UNION ALL SELECT 'Booking', COUNT(*) FROM \"Booking\" WHERE \"tenantId\" IS NULL
UNION ALL SELECT 'WorkOrder', COUNT(*) FROM \"WorkOrder\" WHERE \"tenantId\" IS NULL
UNION ALL SELECT 'Invoice', COUNT(*) FROM \"Invoice\" WHERE \"tenantId\" IS NULL
UNION ALL SELECT 'Expense', COUNT(*) FROM \"Expense\" WHERE \"tenantId\" IS NULL
UNION ALL SELECT 'Attachment', COUNT(*) FROM \"Attachment\" WHERE \"tenantId\" IS NULL
UNION ALL SELECT 'ScheduledReminder', COUNT(*) FROM \"ScheduledReminder\" WHERE \"tenantId\" IS NULL" 
```
- Notes: Migration SQL files already exist under prisma/migrations/20251004_* and are ready for application.

#### Task 2.2: Normalize nullable tenant columns and add compound unique constraints (NOT STARTED)
- Priority: P1 | Effort: 4d | Deadline: 2025-11-08
- Dependencies:
  - Task 2.1 completion to avoid conflicting constraints
  - Inventory of keys per model
- Scope:
  - Convert nullable tenantId to NOT NULL or explicitly mark global rows
  - Add @@unique([tenantId, slug]) and similar composites
  - IdempotencyKey now uses @@unique([tenantId, key]) (migration prepared)
- Execution script:
```bash
set -euo pipefail
# Ensure schema changes present
rg "@@unique\(\[tenantId, key\]\)" prisma/schema.prisma
# Migrate DB
pnpm db:migrate
# Sweep code for non-tenant-scoped idempotency usage
rg "idempotencyKey\.(findUnique|update|upsert)\(\{[^}]*key:" -n src | sed 's/^/- [ ] /'
```
- Important SQL:
```sql
SELECT 'ServiceRequest', COUNT(*) FROM "ServiceRequest" WHERE "tenantId" IS NULL;
```

#### Task 3.1: Backfill tenant columns and resolve orphaned records (PLANNED)
- Priority: P1 | Effort: 5d | Deadline: 2025-11-10
- Dependencies:
  - Read-only snapshot for verification
  - Access to related tables for COALESCE strategies
- Backfill SQL (transactional per table):
```sql
-- ServiceRequest.tenantId from client or service
UPDATE "ServiceRequest" sr
SET "tenantId" = COALESCE(u."tenantId", s."tenantId")
FROM "User" u
LEFT JOIN "Service" s ON s."id" = sr."serviceId"
WHERE sr."clientId" = u."id" AND sr."tenantId" IS NULL;

-- Booking.tenantId from client or linked ServiceRequest
UPDATE "Booking" b
SET "tenantId" = COALESCE(u."tenantId", sr."tenantId")
FROM "User" u
LEFT JOIN "ServiceRequest" sr ON sr."id" = b."serviceRequestId"
WHERE b."clientId" = u."id" AND b."tenantId" IS NULL;

-- WorkOrder.tenantId from related entities
UPDATE "WorkOrder" w
SET "tenantId" = COALESCE(sr."tenantId", b."tenantId", u."tenantId")
FROM "ServiceRequest" sr
LEFT JOIN "Booking" b ON b."id" = w."bookingId"
LEFT JOIN "User" u ON u."id" = w."clientId"
WHERE w."tenantId" IS NULL
  AND (sr."id" = w."serviceRequestId" OR b."id" = w."bookingId" OR u."id" = w."clientId");

-- Invoice/Expense.tenantId
UPDATE "Invoice" i SET "tenantId" = COALESCE(b."tenantId", u."tenantId")
FROM "Booking" b LEFT JOIN "User" u ON u."id" = i."clientId"
WHERE i."tenantId" IS NULL AND (b."id" = i."bookingId" OR u."id" = i."clientId");

UPDATE "Expense" e SET "tenantId" = u."tenantId"
FROM "User" u WHERE e."tenantId" IS NULL AND e."userId" = u."id";

-- Attachment/ScheduledReminder by related entity
UPDATE "Attachment" a SET "tenantId" = sr."tenantId"
FROM "ServiceRequest" sr WHERE a."tenantId" IS NULL AND a."serviceRequestId" = sr."id";

UPDATE "ScheduledReminder" r SET "tenantId" = sr."tenantId"
FROM "ServiceRequest" sr WHERE r."tenantId" IS NULL AND r."serviceRequestId" = sr."id";
```
- Execution script:
```bash
set -euo pipefail
export DATABASE_URL=${DATABASE_URL:?set}
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
-- (paste SQL blocks per-table here)
COMMIT;
SQL
# Verify
node scripts/report-tenant-null-counts.ts
```

#### Task 4.1: Enable RLS and set session variables (IN PROGRESS)
- Priority: P1 | Effort: 8d | Deadline: 2025-11-22
- Dependencies:
  - Task 2.1 nearing completion (tighten policies after NOT NULL enforced)
  - App code using withTenantRLS for sensitive operations
- Execution script:
```bash
set -euo pipefail
pnpm db:rls:enable
# Inspect a representative table
psql "$DATABASE_URL" -c "\\d+ public.services" | sed -n '/Policies/,$p'
```
- App usage:
```ts
import { withTenantRLS } from '@/lib/prisma-rls'
await withTenantRLS(async (tx) => {
  return tx.serviceRequest.findMany({ where: { status: 'SUBMITTED' } })
}, tenantId)
```
- Rollout notes:
  - Current policy allows tenantId IS NULL (global rows). After Phase 2 NOT NULL migrations, tighten to strict equality.
  - Consider FORCE ROW LEVEL SECURITY after stabilization.

#### Task 5.1: Extend NextAuth to include tenant membership (IN PROGRESS)
- Priority: P1 | Effort: 3d | Deadline: 2025-10-25
- Dependencies:
  - Stable TenantMembership model
  - /api/tenant/switch membership validation
- Validation script:
```bash
# Ensure session contains tenant metadata
rg "availableTenants|tenantRole|tenantSlug" -n src/app/api src/lib | sort
# Exercise endpoint
curl -sS -X POST http://localhost:3000/api/tenant/switch -H 'Content-Type: application/json' -d '{"tenantId":"<id>"}' -b cookiejar -c cookiejar | jq .
```

#### Task 9.1: Create tenant-scoped repositories and refactor services (PLANNED)
- Priority: P1 | Effort: 7d | Deadline: 2025-11-10
- Dependencies:
  - Agreement on repository interface and caching keys
  - Inventory of service modules to refactor
- Execution script (scaffold):
```bash
set -euo pipefail
# List Prisma call sites per domain service
rg "prisma\." -n src/services | sed 's/^/- [ ] /'
# Create repos folder and move adapters incrementally (manual assist required)
```

#### Task 12.1: Add tenant-mismatch integration tests (IN PROGRESS)
- Priority: P1 | Effort: 3d | Deadline: 2025-10-25
- Dependencies:
  - withTenantContext in routes under test
  - Middleware cookie issuance working in test env
- Execution script:
```bash
set -euo pipefail
pnpm test:integration -- --grep tenant-mismatch
# Representative security test file:
# tests/integration/tenant-mismatch.security.test.ts
```
- Expected assertions:
  - 403 on invalid tenant_sig
  - Header spoofing ignored; session tenant enforced
  - Subdomain flows segregate tenants

### P2 (Medium)

#### Task 13.1: Monitoring and Observability (IN PROGRESS)
- Priority: P2 | Effort: 2d | Deadline: 2025-10-28
- Dependencies:
  - Logger context includes tenantId/requestId (done)
  - Sentry wiring for tenant tags (server & edge)
- Monitoring Dashboards Proposal:
  - Sentry saved searches: Invalid tenant signature; Tenant guard blocks; RLS denials
  - Logs: Cross-tenant attempt rate per hour; invalid cookie signatures; guard rejections
  - Optional Grafana panels: RLS policy hits; per-tenant error rate vs request volume
- Alerts:
  - Spike in "Invalid tenant signature" (>20/10m)
  - Any "Tenant guard blocked tenant mismatch" in prod
  - RLS denial pattern increase (>5/10m)
- Execution script (Sentry setup pseudo-steps):
```bash
# Create saved searches and dashboard widgets via Sentry UI/API
# Queries:
# message:"Invalid tenant cookie signature" OR message:"Invalid tenant signature" has:tags tag:tenantId:*
# message:"Tenant guard blocked" has:tags tag:tenantId:*
```

#### Task 14.1: Sequence migrations with feature flags and rollback plan (PLANNED)
- Priority: P2 | Effort: 4d | Deadline: 2025-12-01
- Dependencies:
  - Phase 2 backfill/migrations complete
  - Feature flags for guarded rollout
- Execution script:
```bash
# Draft runbook and flags (manual approvals required)
rg "feature flag|rollout" -n scripts docs || true
```

### Blocked
- None currently blocked.

---

## GLOBAL VALIDATION & ROLLBACK
- Pre-deploy Validation:
  1) pnpm lint && pnpm typecheck
  2) pnpm test && pnpm test:integration
  3) node scripts/check_prisma_tenant_columns.js
  4) TARGET_URL=https://staging.example.com AUTH_TOKEN=ey... node scripts/check_tenant_scope.js
- Rollback:
  - git revert <commit> or deploy previous tag
  - Restore DB snapshot and rollback migrations
- Escalation:
  - Platform/Auth lead: @platform-auth
  - DB lead: @db-team
  - SRE on-call: pagerduty/SRE
  - Security: Slack #security + legal

---

## ARCHIVE: COMPLETED (All details preserved)

### Phase 0: Planning and Governance (COMPLETE)
- Task 0.1: Confirm executive sponsorship and security requirements (PARTIAL COMPLETE)
  - Subtasks: [x] Document security requirements and zero-trust goals; [ ] Confirm sponsor
- Task 0.2: Define tenant identifier canonical source and naming conventions (COMPLETE)
- Task 0.3: Catalog tenant-owned models and singletons (COMPLETE)

### Phase 1: Middleware & API Hardening (COMPLETE)
- Task 1.1: Harden middleware and tenant cookie issuance (COMPLETE)
  - Files: src/app/middleware.ts, src/lib/tenant-cookie.ts
  - Criteria: tenant_sig issued; headers stripped; requestId/tenantId/userId logging
- Task 1.2: Apply withTenantContext wrapper across admin and portal API routes (COMPLETE)
  - Remaining routes checklist resolved; ESLint rule: no direct getServerSession; isolation tests pass
- Task 1.3: Verify tenant signature in API wrapper (COMPLETE)
  - Invalid tenant_sig → 403; valid accepted

### Phase 6: Tenant Context Propagation (COMPLETE)
- Task 6.1: AsyncLocalStorage tenantContext and helpers implemented

### Phase 7: Middleware and Request Pipeline (COMPLETE)
- Task 7.1: Matcher and header handling

### Phase 8: Prisma Client Enhancements (COMPLETE)
- Task 8.1: registerTenantGuard and auto-injection of tenant filters

### Phase 11: Client and Portal Adjustments (COMPLETE)
- Task 11.1: Remove client-side tenant header injection; TenantSwitcher calls secure endpoint

### Additional Completed Work (Auto-log excerpts preserved)
- Stabilize tenant settings migration by consolidating orphan rows
- Unblock Netlify build: harden 20250214_tenant_settings_not_null
- Fix login 401 with preview credentials fallback and auto-provisioning
- Add Forgot Password page and full tenant-aware reset flow
- Upgrade login security and auditing; rate limits
- Fix Vercel build errors (Prisma types, idempotency, nested connect patterns)
- Restore public service-request creation typing and tenant-safe idempotency guard
- Idempotency: composite unique (tenantId, key); helpers and Stripe webhook updated
- Sentry tagging with tenant context (server/edge)

All technical content, SQL, and commands retained below verbatim for reference:

---

### Reference: Recent progress and migration/backfill details (verbatim)

Recent progress (2025-10-05):
- Added SQL migrations under prisma/migrations to enforce tenantId NOT NULL with FKs and indexes for: bookings, ServiceRequest, services, WorkOrder, invoices, expenses, ScheduledReminder, booking_settings, IdempotencyKey
- Each migration adds column if missing, backfills where derivable, adds FK to Tenant(id) ON DELETE CASCADE, creates indexes, then sets NOT NULL.
- Enforced Attachment.tenantId NOT NULL and added FK + backfill; uploads API now requires tenant context and persists tenant relation.

Apply order (recommended):
1) services
2) ServiceRequest
3) bookings
4) WorkOrder
5) invoices
6) expenses
7) ScheduledReminder
8) booking_settings
9) IdempotencyKey

Backfill notes:
- Bookings: COALESCE(user.tenantId, serviceRequest.tenantId, service.tenantId)
- ServiceRequest: COALESCE(user.tenantId, service.tenantId)
- WorkOrder: COALESCE(serviceRequest.tenantId, booking.tenantId, user.tenantId, service.tenantId)
- Invoices: COALESCE(booking.tenantId, user.tenantId)
- Expenses: user.tenantId
- ScheduledReminder: serviceRequest.tenantId

Execution (operator-run):
- Take DB backup. Then apply in order with:
  pnpm tsx scripts/apply-migration-file.ts prisma/migrations/20251005_add_service_tenantid_not_null/migration.sql
  ... (continue in the order above)

Risks:
- Existing rows without derivable tenantId will block NOT NULL. Inspect with scripts/report-tenant-null-counts.ts and remediate.
- Attachment NOT NULL deferred; addressed after uploads API always sets tenantId via tenant context.

AI Agent Steps:
```bash
pnpm db:generate
pnpm db:migrate
node scripts/check_prisma_tenant_columns.js
```

Verification queries:
```sql
SELECT 'ServiceRequest', COUNT(*) FROM "ServiceRequest" WHERE "tenantId" IS NULL
UNION ALL SELECT 'Booking', COUNT(*) FROM "Booking" WHERE "tenantId" IS NULL
UNION ALL SELECT 'WorkOrder', COUNT(*) FROM "WorkOrder" WHERE "tenantId" IS NULL
UNION ALL SELECT 'Invoice', COUNT(*) FROM "Invoice" WHERE "tenantId" IS NULL
UNION ALL SELECT 'Expense', COUNT(*) FROM "Expense" WHERE "tenantId" IS NULL
UNION ALL SELECT 'Attachment', COUNT(*) FROM "Attachment" WHERE "tenantId" IS NULL
UNION ALL SELECT 'ScheduledReminder', COUNT(*) FROM "ScheduledReminder" WHERE "tenantId" IS NULL
```

Row Level Security (RLS):
- Script: scripts/setup-rls.ts (idempotently enables policies for all tables with tenantId)
- Helper: src/lib/prisma-rls.ts (withTenantRLS, setTenantRLSOnTx)

Idempotency changes:
- prisma/schema.prisma: @@unique([tenantId, key])
- src/lib/idempotency.ts and payments webhook updated to enforce tenant scope

Testing:
- tests/integration/tenant-mismatch.security.test.ts validates 403 on invalid tenant_sig and header spoofing ignored

---

## PROGRESS SUMMARY
- Tasks: ✅ Complete: 71 | 🔥 In Progress: 24 | ❌ Not Started: 46 | 🔒 Blocked: 0



## ✅ Completed
- [x] Context reload from docs/Comprehensive Tenant System-todo.md, prisma/schema.prisma, and scripts/setup-rls.ts
  - **Why**: Establish baseline state and avoid duplicative analysis
  - **Impact**: Ensures continuity with Phase 1 work and accurate planning for RLS + migrations

## ⚠️ Issues / Risks
- NETLIFY_DATABASE_URL must be present for Prisma and RLS tooling; missing env will halt scripts/setup-rls.ts
- Current RLS policy allows tenantId IS NULL; tighten after NOT NULL migrations to eliminate global rows

## 🚧 In Progress
- [ ] Plan and verify rollout for Task 4.1 (RLS enablement and policy verification)

## 🔧 Next Steps
- [ ] Execute pnpm db:rls:enable in staging; verify policies on public.services
- [ ] Apply NOT NULL tenantId migrations for remaining 9 models in the recommended order
- [ ] Add tenant-mismatch integration tests for cookie/header and subdomain flows (Task 12.1)
- [ ] Extend NextAuth session to include tenant membership metadata (Task 5.1)
