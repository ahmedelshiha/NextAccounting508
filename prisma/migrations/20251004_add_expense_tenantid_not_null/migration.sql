-- Migration: Make expenses.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "expenses" DROP CONSTRAINT IF EXISTS "expenses_tenantId_fkey";
ALTER TABLE IF EXISTS "expenses" ADD CONSTRAINT "expenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
