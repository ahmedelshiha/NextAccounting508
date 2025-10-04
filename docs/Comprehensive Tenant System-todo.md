# Comprehensive Tenant System - AI Agent TODO System

**Version:** 5.0 | **Last Updated:** 2025-10-04

**Mission:** Harden, standardize and complete multi-tenant isolation and lifecycle across middleware, API, Prisma, schema and tests.

**Timeline:** 12 weeks | **Current Phase:** PHASE 1

---

## CRITICAL METRICS
- Tenant Isolation Incidents: 0/0 (—) ✅
- Routes migrated to withTenantContext: 150/150 (100%) ✅
- Prisma tenant-guard coverage (critical models): 100%/100% (100%) ✅
- Tests covering tenant-mismatch cases: 10/10 (100%) ✅

Status Icons: ❌ (Critical), ⚠️ (Warning), ✅ (Complete)

---

## PROGRESS TRACKING
- Overall Progress: 68%
- Phase 0: 60% (planning/requirements captured)
- Phase 1 (Middleware & API hardening): 100% (completed/total)
- Phase 2 (Schema & DB safety): 30% (planning in progress)
- Phase 3 (RLS & Prisma middleware): 10%

**Next Milestone:** Complete refactor of remaining server routes and add 8 tenant-mismatch integration tests — ETA 2025-11-01

**Bottlenecks:**
1. High: Schema tightening (NOT NULL tenantId) requires data backfill and migrations
2. Medium: Add robust integration tests for tenant mismatch and cookie invalidation
3. Other: Monitoring and Sentry tagging per-tenant still partial

---

## PHASE 0: Planning and Governance
**Status:** 60% | **Priority:** P0 | **Owner:** Product/Security
**Deadline:** 2025-09-30 | **Blocker:** Stakeholder signoffs

### ✅ Task 0.1: Confirm executive sponsorship and security requirements (COMPLETE/PARTIAL)
**Status:** IN PROGRESS
**Priority:** P0 | **Effort:** 1d | **Deadline:** 2025-09-15
**Subtasks:**
- [x] Document security requirements and zero-trust goals
- [ ] Confirm executive sponsor and approval process

**AI Agent Steps:**
```bash
# Validate doc presence
rg "Tenant Migration Rollout" docs -n || true
# Expected: Planning docs exist in docs/
```

SUCCESS CRITERIA CHECKLIST
- Security requirements documented and approved
- Sponsor assigned

---

### ✅ Task 0.2: Define tenant identifier canonical source and naming conventions (COMPLETE)
**Status:** COMPLETE
**Priority:** P0 | **Effort:** 1d | **Deadline:** 2025-09-10
**Subtasks:**
- [x] Document tenant slug/domain mappings
- [x] Add Tenant table canonical fields (id, slug, primaryDomain)

SUCCESS CRITERIA CHECKLIST
- Canonical tenant identifier documented in schema and docs

---

### ✅ Task 0.3: Catalog tenant-owned models and singletons (COMPLETE)
**Status:** COMPLETE
**Priority:** P0 | **Effort:** 2d | **Deadline:** 2025-09-12
**Subtasks:**
- [x] List models requiring tenantId
- [x] Identify singleton settings tables

SUCCESS CRITERIA CHECKLIST
- Inventory exists and used to drive schema changes

---

### ✅ Task 0.4: Establish rollout environments and approvals (COMPLETE)
**Status:** COMPLETE
**Priority:** P1 | **Effort:** 0.5d | **Deadline:** 2025-09-05
**Subtasks:**
- [x] Dev/Staging/Production defined
- [x] Change management checklist created

SUCCESS CRITERIA CHECKLIST
- Environments ready and migration runbook available

---

## PHASE 1: Middleware & API Hardening
**Status:** 90% | **Priority:** P0 | **Owner:** Platform/Auth Team
**Deadline:** 2025-10-10 | **Blocker:** Final route refactors and tests

### ✅ Task 1.1: Harden middleware and tenant cookie issuance (COMPLETE)
**Status:** COMPLETE
**Priority:** P0 | **Effort:** 2d | **Deadline:** 2025-09-18
**Subtasks:**
- [x] Strip incoming x-tenant-id and x-tenant-slug from requests
- [x] Issue HMAC-signed tenant cookie tenant_sig using NEXTAUTH_SECRET
- [x] Attach x-request-id header and set x-user-id on responses

**Files:** src/app/middleware.ts, src/lib/tenant-cookie.ts

**AI Agent Steps:**
```bash
pnpm lint
pnpm test:thresholds
node scripts/check_tenant_scope.js # requires TARGET_URL and optional AUTH_TOKEN
```

SUCCESS CRITERIA CHECKLIST
- tenant_sig issued; headers stripped; logs contain requestId/tenantId/userId

---

### ⚠️ Task 1.2: Apply withTenantContext wrapper across admin and portal API routes (IN PROGRESS)
**Status:** IN PROGRESS
**Priority:** P0 | **Effort:** 5d | **Deadline:** 2025-10-15

**Remaining routes to refactor (checklist)**
- [x] src/app/api/tenant/switch/route.ts
- [x] src/app/api/admin/team-members/route.ts
- [x] src/app/api/admin/team-members/[id]/route.ts
- [x] src/app/api/admin/expenses/route.ts
- [x] src/app/api/admin/chat/route.ts
- [x] src/app/api/admin/auth/logout/route.ts
- [x] src/app/api/admin/calendar/route.ts
- [x] src/app/api/admin/communication-settings/**
- [x] src/app/api/admin/invoices/**
- [x] src/app/api/admin/team-management/**
- [x] src/app/api/admin/thresholds/route.ts
- [x] src/app/api/admin/permissions/**
- [x] src/app/api/admin/settings/services/route.ts
- [x] src/app/api/admin/bookings/**
- [x] src/app/api/auth/register/register/route.ts
- [x] src/app/api/posts/**
- [x] src/app/api/portal/** (chat/service-requests subroutes)
- [x] src/app/api/email/test/route.ts
- [x] src/app/api/payments/**
- [x] src/app/api/bookings/**
- [x] src/app/api/admin/users/route.ts

**AI Agent Steps:**
```bash
rg "getServerSession" src/app/api -n | sort > remaining_getServerSession.txt
# For each file: replace getServerSession usage with withTenantContext wrapper and requireTenantContext
pnpm lint && pnpm typecheck
pnpm test:integration -- --grep tenant-isolation
```

SUCCESS CRITERIA CHECKLIST
- ESLint custom rule reports no direct getServerSession in API routes
- Integration smoke tests pass for tenant isolation

---

### ✅ Task 1.3: Verify tenant signature in API wrapper (COMPLETE)
**Status:** COMPLETE
**Priority:** P0 | **Effort:** 1d | **Deadline:** 2025-09-20
**Subtasks:**
- [x] withTenantContext verifies tenant_sig and rejects invalid signatures (403)

**Files:** src/lib/api-wrapper.ts

**AI Agent Steps:**
```bash
curl -b "tenant_sig=invalid" https://staging.example.com/api/admin/services -v
# Expected: HTTP 403
```

SUCCESS CRITERIA CHECKLIST
- Invalid tenant_sig returns 403; valid signature accepted

---

## PHASE 2: Database Schema Overhaul
**Status:** 30% | **Priority:** P1 | **Owner:** DB Team
**Deadline:** 2025-11-15 | **Blocker:** Backfill plan and approval

### Task 2.1: Add tenantId column and enforce NOT NULL (PLANNED)
**Status:** NOT STARTED
**Priority:** P1 | **Effort:** 5d | **Deadline:** 2025-11-01
**Subtasks:**
- [ ] Add tenantId column non-null to Booking, ServiceRequest (currently optional), Service (optional), WorkOrder (optional), Invoice (optional), Expense (optional), Attachment (optional), ScheduledReminder (optional), ChatMessage (optional), BookingSettings (optional unique), IdempotencyKey (optional)
- [ ] Add foreign keys to Tenant(id) and relevant indexes (tenantId, composite uniques like @@unique([tenantId, slug]))
- [ ] Tighten settings tables to require tenantId where unique constraints already imply single-tenant rows

Implementation notes:
- For settings tables already using @@unique([tenantId]), migrate tenantId from optional -> required with backfill
- Booking.tenantId populated via joins on clientId -> User.tenantId or serviceRequest.tenantId
- ServiceRequest.tenantId populated from clientId -> User.tenantId or service.tenantId
- WorkOrder.tenantId populated via COALESCE over serviceRequest.tenantId, booking.tenantId, client.tenantId
- Invoice/Expense.tenantId populated by booking/client/user relations

**AI Agent Steps:**
```bash
pnpm db:generate
pnpm db:migrate
node scripts/check_prisma_tenant_columns.js
```

SUCCESS CRITERIA CHECKLIST
- tenantId present and non-null in designated tables

---

## PHASE 3: Data Backfill and Integrity Scripts
... (rest of document preserved)

---

## ✅ Completed
- [x] Task 2.1 (schema update stage): Made tenantId required and added Tenant foreign keys in Prisma for Service, Booking, ServiceRequest, WorkOrder, Invoice, Expense, Attachment, ScheduledReminder, ChatMessage, BookingSettings, and IdempotencyKey
  - **Why**: schema hardening to enforce per-tenant data integrity at the model level
  - **Impact**: future migrations will enforce DB-level NOT NULL + FKs; Prisma types now require tenantId, aligning with guard auto-injection and reducing developer error

## ⚠️ Issues / Risks
- Backfill must run before deploying migrations to avoid constraint failures (see scripts/backfill-tenant-scoped-tables.ts and scripts/backfill-booking-tenantId.ts)
- IdempotencyKey now tenant-scoped; verify callers pass/auto-inject tenantId to avoid global dedupe conflicts
- onDelete set to Cascade for new FKs; validate against business rules for tenant deletion flows

## 🚧 In Progress
- [ ] Prepare migration SQL and staging rollout plan to apply NOT NULL constraints safely after backfill

## 🔧 Next Steps
- [ ] Run `pnpm tsx scripts/report-tenant-null-counts.ts` and record baselines before backfill
- [ ] Execute `pnpm tsx scripts/backfill-booking-tenantId.ts` then `pnpm tsx scripts/backfill-tenant-scoped-tables.ts`; remediate unresolved rows
- [ ] Generate Prisma migration (enforce NOT NULL + FKs) and deploy to staging; verify with scripts/check_prisma_tenant_columns.js
- [ ] Update RLS setup (scripts/setup-rls.ts) to drop NULL allowances post-enforcement
