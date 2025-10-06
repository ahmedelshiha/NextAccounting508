

## ✅ Completed
- [x] Assessed RLS coverage and tenantContext usage; ensured tenant guard is applied to central Prisma client
  - **Why**: Prevent accidental cross-tenant reads/writes and ensure consistent enforcement across server code
  - **What I changed**:
    - Many operational scripts under scripts/ were updated to import the shared Prisma client (import prisma from '@/lib/prisma') so registerTenantGuard is applied consistently.
    - Ensured application code uses queryTenantRaw / withTenantRLS for raw SQL paths (db-raw.ts) and uses withTenantContext for App Router API routes.
  - **Files changed**: multiple scripts in scripts/ (backfills/migrations/inspection/seed scripts) and src/lib/default-tenant.ts, src/app/middleware.ts

## ⚠️ Remaining manual review items
- scripts/create_jwt_session.js still instantiates PrismaClient directly via require('@prisma/client'). It's a small utility script; consider migrating to shared prisma import when executing via tsx/tsx-compatible runner or convert to .ts.
- Any external Netlify functions or serverless contexts that create PrismaClient separately should be reviewed; run a grep for "new PrismaClient" in non-scripts folders if needed.

## 🚧 In Progress / Next steps
- [ ] Add regression tests asserting tenant-guard blocks cross-tenant operations and RLS enforcement for db-raw paths
- [ ] Run scripts in a staging preview to validate scripts now operate correctly with shared client
- [ ] Consider adding lint rule or developer guidance to always import shared prisma from '@/lib/prisma' to prevent future direct instantiations

## ⏸️ Paused / Pending (to execute later)
- Paused on: 2025-10-06T00:00:00Z
- Reason: Operator requested to pause code changes and collect pending tasks for later execution.

Pending tasks (will be executed later):
- [ ] Add regression tests for tenant header propagation, guard enforcement, and RLS (withTenantRLS + queryTenantRaw)
  - Location: tests/integration/ and tests/unit/
  - Notes: include both positive (scoped access) and negative (cross-tenant blocked) cases; mock prisma as needed for unit tests.
- [ ] Audit API routes and services for missing tenantFilter/getResolvedTenantId usage
  - Location: src/app/api/** and src/services/**
  - Notes: prioritize endpoints that handle raw SQL or operate outside withTenantContext.
- [ ] Backfill/migration validation run against staging DB (non-destructive checks)
  - Location: scripts/backfill-*.ts and scripts/run-tenant-migrations.sh
  - Notes: perform dry-run where possible; snapshot DB before DDL/DML.
- [ ] Migrate or update remaining scripts creating new PrismaClient instances to use shared prisma client
  - Location: scripts/* (scripts/create_jwt_session.js is priority)
  - Notes: update Node-only scripts to import '@/lib/prisma' or convert to TS and run via tsx.
- [ ] Add lint rule / developer guideline to enforce importing shared prisma (e.g., ESLint rule or code-review checklist)
- [ ] Enable MULTI_TENANCY_STRICT in staging and monitor logs for middleware warnings before enabling in production
  - Files: .env.staging, CI settings

## 🔁 How to resume
- When ready, unpause by removing this PAUSED section or marking individual tasks as [x] when completed.
- I will continue executing items from top to bottom when resumed automatically.
