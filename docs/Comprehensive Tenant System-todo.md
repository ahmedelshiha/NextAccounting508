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

## AI Agent Update (2025-10-06)

## ✅ Completed
- [x] Context reload from docs/Comprehensive Tenant System-todo.md
  - Why: Follow stateful workflow and reuse prior analysis
  - Impact: Ensures continuity and avoids re-analysis
- [x] Created missing SQL migrations to enforce NOT NULL on tenantId
  - Why: Complete Task 2.1 prerequisites in-repo
  - Impact: Blocks cross-tenant leakage at DB layer; prepares for RLS tightening
  - Files:
    - prisma/migrations/20251004_add_service_tenantid_not_null/migration.sql
    - prisma/migrations/20251004_add_servicerequest_tenantid_not_null/migration.sql
    - prisma/migrations/20251004_add_booking_tenantid_not_null/migration.sql
    - prisma/migrations/20251004_add_workorder_tenantid_not_null/migration.sql
    - prisma/migrations/20251004_add_invoice_tenantid_not_null/migration.sql
    - prisma/migrations/20251004_add_expense_tenantid_not_null/migration.sql
    - prisma/migrations/20251004_add_scheduledreminder_tenantid_not_null/migration.sql
    - prisma/migrations/20251004_add_bookingsettings_tenantid_not_null/migration.sql
    - prisma/migrations/20251004_add_idempotencykey_tenantid_not_null/migration.sql

## ⚠️ Issues / Risks
- Applying NOT NULL will fail if any NULL rows remain; must run backfill first.
- Table names with mixed-case are quoted; migrations handle exact names, but run in a safe staging env first.

## 🚧 In Progress
- [ ] Validate no remaining NULL tenantId rows using scripts/report-tenant-null-counts.ts
- [ ] Prepare execution window and DB snapshot for migration deploy

## 🔧 Next Steps
- [ ] Run: pnpm tsx scripts/backfill-tenant-scoped-tables.ts
- [ ] Deploy migrations: pnpm db:migrate (or prisma migrate deploy)
- [ ] Regenerate client and tests: pnpm db:generate && pnpm typecheck && pnpm test:integration
- [ ] Enable RLS: pnpm db:rls:enable and inspect policies on representative tables
