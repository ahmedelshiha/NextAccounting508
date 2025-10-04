-- Migration: Make WorkOrder.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "WorkOrder" DROP CONSTRAINT IF EXISTS "workorder_tenantId_fkey";
ALTER TABLE IF EXISTS "WorkOrder" ADD CONSTRAINT "workorder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "WorkOrder" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
