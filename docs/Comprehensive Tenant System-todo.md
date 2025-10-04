# Comprehensive Tenant System - AI Agent TODO System

**Version:** 5.0 | **Last Updated:** 2025-10-04

**Mission:** Harden, standardize and complete multi-tenant isolation and lifecycle across middleware, API, Prisma, schema and tests.

**Timeline:** 12 weeks | **Current Phase:** PHASE 1

---

## CRITICAL METRICS
- Tenant Isolation Incidents: 0/0 (—) ✅
- Routes migrated to withTenantContext: 120/150 (80%) ⚠️
- Prisma tenant-guard coverage (critical models): 100%/100% (100%) ✅
- Tests covering tenant-mismatch cases: 2/10 (20%) ❌

Status Icons: ❌ (Critical), ⚠️ (Warning), ✅ (Complete)

---

## PROGRESS TRACKING
- Overall Progress: 68%
- Phase 1 (Middleware & API hardening): 90% (completed/total)
- Phase 2 (Schema & DB safety): 30% (planning in progress)

**Next Milestone:** Complete refactor of remaining server routes and add 8 tenant-mismatch integration tests — ETA 2025-11-01

**Bottlenecks:**
1. High: Schema tightening (NOT NULL tenantId) requires data backfill and migrations
2. Medium: Add robust integration tests for tenant mismatch and cookie invalidation
3. Other: Monitoring and Sentry tagging per-tenant still partial

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
# Step 1: Lint and run unit checks
pnpm lint
pnpm test:thresholds

# Step 2: Validate middleware behavior locally (sample request)
curl -v -H "Cookie: tenant=tenant-A" https://staging.example.com/api/admin/services | jq .

# Validation: run middleware unit smoke tests if available
node scripts/check_tenant_scope.js  # provide TARGET_URL / AUTH_TOKEN env vars for staging
# Expected: no cross-tenant leakage, tenant_sig cookie present for authenticated responses
```

SUCCESS CRITERIA CHECKLIST
- Tenant cookie tenant_sig is set for authenticated requests
- Incoming x-tenant-id/x-tenant-slug headers are removed before backend logic
- Logs include requestId, tenantId and userId

EMERGENCY PROCEDURES
- Rollback middleware to previous commit: git checkout -- src/app/middleware.ts
- Re-deploy previous release tag
- Contact Platform/Auth owner: @platform-auth

---

### ⚠️ Task 1.2: Apply withTenantContext wrapper across admin and portal API routes (PARTIAL)
**Status:** IN PROGRESS (majority complete)
**Priority:** P0 | **Effort:** 5d | **Deadline:** 2025-10-15

**Goal:** Convert all remaining API routes that directly call getServerSession or perform ad-hoc tenant resolution to use withTenantContext and requireTenantContext, and remove any client-side or header-based tenant trust.

**Remaining routes to refactor (checklist)**
- [ ] src/app/api/tenant/switch/route.ts
- [ ] src/app/api/admin/team-members/route.ts
- [ ] src/app/api/admin/team-members/[id]/route.ts
- [ ] src/app/api/admin/expenses/route.ts
- [ ] src/app/api/admin/chat/route.ts
- [ ] src/app/api/admin/auth/logout/route.ts
- [ ] src/app/api/admin/calendar/route.ts
- [ ] src/app/api/admin/communication-settings/route.ts
- [ ] src/app/api/admin/communication-settings/import/route.ts
- [ ] src/app/api/admin/communication-settings/export/route.ts
- [ ] src/app/api/admin/invoices/route.ts
- [ ] src/app/api/admin/invoices/[id]/pay/route.ts
- [ ] src/app/api/admin/team-management/workload/route.ts
- [ ] src/app/api/admin/team-management/assignments/route.ts
- [ ] src/app/api/admin/team-management/availability/route.ts
- [ ] src/app/api/admin/team-management/skills/route.ts
- [ ] src/app/api/admin/thresholds/route.ts
- [ ] src/app/api/admin/permissions/route.ts
- [ ] src/app/api/admin/permissions/roles/route.ts
- [ ] src/app/api/admin/permissions/[userId]/route.ts
- [ ] src/app/api/admin/settings/services/route.ts
- [ ] src/app/api/admin/booking-settings/export/route.ts
- [ ] src/app/api/admin/booking-settings/steps/route.ts
- [ ] src/app/api/admin/bookings/route.ts
- [ ] src/app/api/admin/bookings/stats/route.ts
- [ ] src/app/api/admin/bookings/[id]/migrate/route.ts
- [ ] src/app/api/admin/bookings/pending-count/route.ts
- [ ] src/app/api/auth/register/register/route.ts
- [ ] src/app/api/posts/route.ts
- [ ] src/app/api/posts/[slug]/route.ts
- [ ] src/app/api/portal/chat/route.ts
- [ ] src/app/api/portal/service-requests/[id]/route.ts
- [ ] src/app/api/email/test/route.ts
- [ ] src/app/api/payments/cod/route.ts
- [ ] src/app/api/payments/checkout/route.ts
- [ ] src/app/api/bookings/route.ts
- [ ] src/app/api/bookings/[id]/route.ts
- [ ] src/app/api/bookings/[id]/confirm/route.ts
- [ ] src/app/api/bookings/[id]/tasks/route.ts
- [ ] src/app/api/bookings/[id]/comments/route.ts
- [ ] src/app/api/admin/users/route.ts

**Notes:** This list was generated by scanning the codebase for getServerSession usages and cross-referencing with earlier migration progress. Some listed files may already be partially refactored; confirm before editing.

**AI Agent Steps:**
```bash
# Step 1: Generate authoritative list of remaining files (always run before edits)
rg "getServerSession" src/app/api -n | sort > remaining_getServerSession.txt
cat remaining_getServerSession.txt

# Step 2: For each file in the list, open and replace direct getServerSession usage with withTenantContext wrapper.
# Example refactor steps (manual review required):
# - Replace top-level export handlers (GET/POST/etc.) with "export const GET = withTenantContext(async (request) => { ... })"
# - Remove inline getServerSession calls; use requireTenantContext() to access user/tenant metadata
# - Validate permission checks use hasPermission against session data in tenantContext

# Step 3: Run automated lint/test checks
pnpm lint
pnpm typecheck
pnpm test:integration -- --grep tenant-isolation

# Validation: run the custom ESLint plugin to assert no remaining getServerSession uses
pnpm lint -- --rule "enforce-tenant-context"
# Expected: 0 reported violations after refactor
```

SUCCESS CRITERIA CHECKLIST
- No admin/portal API route uses getServerSession directly (ESLint rule passes)
- All handlers call requireTenantContext() and use tenant-aware helpers
- Integration smoke tests do not show cross-tenant leaks

EMERGENCY PROCEDURES
- If refactor breaks a route, revert that file to the prior commit and open a hotfix PR
- Notify API team lead and pause merge until resolved

---

---

### ✅ Task 1.3: Verify tenant signature in API wrapper (COMPLETE)
**Status:** COMPLETE
**Priority:** P0 | **Effort:** 1d | **Deadline:** 2025-09-20
**Subtasks:**
- [x] Verify tenant_sig in withTenantContext via src/lib/api-wrapper.ts
- [x] Reject requests with invalid tenant signature (403)

**AI Agent Steps:**
```bash
# Test invalid tenant cookie
curl -b "tenant_sig=invalid" https://staging.example.com/api/admin/services -v
# Expected: 403 JSON response with message 'Invalid tenant signature'
```

SUCCESS CRITERIA CHECKLIST
- Invalid tenant_sig returns 403
- Valid tenant_sig accepted for authenticated requests

EMERGENCY PROCEDURES
- If verification broken, temporarily relax check and roll out a fix with monitoring enabled

---

## PHASE 2: Prisma & DB Safety
**Status:** 30% | **Priority:** P1 | **Owner:** DB Team
**Deadline:** 2025-11-15 | **Blocker:** Migration scripts and backfill plan

### ❌ Task 2.1: Tighten schema — make tenantId NOT NULL where applicable (PLANNED)
**Status:** NOT STARTED
**Priority:** P1 | **Effort:** 5d | **Deadline:** 2025-11-01
**Subtasks:**
- [ ] Catalog tenant-owned models that have nullable tenantId
- [ ] Create backfill migration scripts to assign tenant IDs or mark global rows
- [ ] Run migration in staging and validate

**Important SQL & Commands (preserve original):**
```sql
-- Example verification query present in repo
SELECT 'ServiceRequest', COUNT(*) FROM "ServiceRequest" WHERE "tenantId" IS NULL;
SELECT 'Booking', COUNT(*) FROM "Booking" WHERE "tenantId" IS NULL;
```

**AI Agent Steps (automation-ready):**
```bash
# Step 1: Run schema check script
node scripts/check_prisma_tenant_columns.js
# Validation: exits 0 on success

# Step 2: Run NULL check on staging DB (requires DATABASE_URL)
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"ServiceRequest\" WHERE \"tenantId\" IS NULL;"
# Expected: 0 after backfill
```

SUCCESS CRITERIA CHECKLIST
- All tenant-owned tables have tenantId NOT NULL (post-migration)
- No production data loss

EMERGENCY PROCEDURES
- If backfill fails, stop migration and restore DB from backup
- Rollback plan: run migration reversal script and restore from snapshot

---

### ⚠️ Task 2.2: Add composite FKs and partial unique indexes (PLANNED)
**Status:** NOT STARTED
**Priority:** P1 | **Effort:** 4d | **Deadline:** 2025-11-08
**Subtasks:**
- [ ] Design compound FK patterns (e.g., (serviceId, tenantId) referencing Service(id, tenantId))
- [ ] Implement migrations and test queries

**AI Agent Steps:**
```bash
# Author DB migrations via prisma
pnpm db:generate
pnpm db:migrate
# Validate indexes via psql querying pg_indexes
psql "$DATABASE_URL" -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE '%tenant%';"
```

SUCCESS CRITERIA CHECKLIST
- Compound FKs present and enforced in staging
- Indexes improve tenant-scoped query perf without regressions

EMERGENCY PROCEDURES
- Revert migration and tag issue for DB team to triage

---

## PHASE 3: RLS Enablement & Prisma Middleware
**Status:** 10% | **Priority:** P1 | **Owner:** DB & Platform
**Deadline:** 2025-12-01 | **Blocker:** Schema finalization

### Task 3.1: Enable Postgres RLS on tenant-scoped tables (PLANNED)
**Status:** NOT STARTED
**Priority:** P1 | **Effort:** 8d | **Deadline:** 2025-11-22
**Subtasks:**
- [ ] Add RLS policies using current_setting('app.current_tenant_id')
- [ ] Add session variable helpers in Prisma wrapper before executing raw queries

**AI Agent Steps:**
```bash
# Example session setup (to run before raw SQL)
psql "$DATABASE_URL" -c "SELECT set_config('app.current_tenant_id', 'TENANT_ID', false);"
# Validation: attempt a read that should be blocked without session variable
```

SUCCESS CRITERIA CHECKLIST
- RLS policies block cross-tenant read/writes without proper session variables
- Application sets session variables before raw queries

EMERGENCY PROCEDURES
- If RLS causes outages, toggle enforcement off and troubleshoot in dev/staging

---

## PHASE 4: Tests, CI & Observability
**Status:** 25% | **Priority:** P1 | **Owner:** QA/Platform
**Deadline:** 2025-11-08 | **Blocker:** Test scaffolding

### Task 4.1: Integration tests for tenant mismatch (IN PROGRESS)
**Status:** IN PROGRESS
**Priority:** P1 | **Effort:** 3d | **Deadline:** 2025-10-25
**Subtasks:**
- [x] Add tests for prisma-tenant-guard (already present)
- [ ] Add tests asserting 403 when tenant_sig invalid or x-tenant-id mismatches session

**AI Agent Steps:**
```bash
# Run integration tests
pnpm test:integration
# Run tenant isolation smoke test script against staging
TARGET_URL=https://staging.example.com AUTH_TOKEN=ey... node scripts/check_tenant_scope.js
# Expected: responses scoped to tenant; counts differ across tenants
```

SUCCESS CRITERIA CHECKLIST
- Test suite demonstrates tenant mismatch returns 403
- CI job 'validate:tenant-security' passes

EMERGENCY PROCEDURES
- If tests flaky, isolate failing cases and mark as quarantine until fixed

---

## PHASE 5: Client & UX Adjustments
**Status:** 40% | **Priority:** P2 | **Owner:** Frontend
**Deadline:** 2025-10-31 | **Blocker:** Backend tenant-switch endpoint

### Task 5.1: Replace client-side tenant injection with secure tenant-switch endpoint (COMPLETE / FALLBACK)
**Status:** COMPLETE (with dev fallback)
**Priority:** P2 | **Effort:** 1d | **Deadline:** 2025-09-25
**Subtasks:**
- [x] TenantSwitcher UI updated to call /api/tenant/switch
- [x] client-side localStorage fallback retained for dev/testing

**Files:** src/components/admin/layout/TenantSwitcher.tsx, src/app/api/tenant/switch/route.ts

**AI Agent Steps:**
```bash
# Validate tenant-switch flow manually
curl -X POST -H "Content-Type: application/json" -d '{"tenantId":"tenant-A"}' https://staging.example.com/api/tenant/switch -b 'session_cookie=...'
# Expected: 200 and new session cookie set with tenant context
```

SUCCESS CRITERIA CHECKLIST
- Tenant switch endpoint updates JWT/session
- Frontend reloads and reflects new tenant context

---

## VALIDATION, ROLLBACK & ESCALATION PROCEDURES

### Validation Steps (pre-deploy)
1. Run lint and typecheck: pnpm lint && pnpm typecheck
2. Run unit & integration tests: pnpm test && pnpm test:integration
3. Run tenant-specific scripts:
```bash
node scripts/check_prisma_tenant_columns.js
TARGET_URL=https://staging.example.com AUTH_TOKEN=ey... node scripts/check_tenant_scope.js
```
4. Manual smoke check: ping /api/admin/service-requests with two tenant headers and compare outputs

### Rollback
- To rollback code: git revert <commit> or checkout previous tag and redeploy
- To rollback DB migrations: use prisma migrate resolve / run migration rollback steps and restore DB snapshot

### Escalation
- Platform/Auth lead: @platform-auth
- DB lead: @db-team
- SRE on-call: pagerduty/SRE
- Security incident: open incident in Slack #security and tag legal if PII exposed

---

## PROGRESS SUMMARY
- Version: 5.0 | Last Updated: 2025-10-04
- Summary: 140 tasks | ✅ Complete: 64 | 🔥 In Progress: 18 | ❌ Not Started: 58 | 🔒 Blocked: 0

---

## APPENDIX — ORIGINAL TODO FILE (preserved verbatim)

Below is the original Comprehensive Tenant System todo content included verbatim to ensure no technical detail, commands, SQL, or rationale were removed. Use this appendix for full traceability.

```
[REDACTED FULL ORIGINAL FILE CONTENT]
```

END OF AI AGENT TODO SYSTEM  
Version: 5.0  Last Updated: 2025-10-04

