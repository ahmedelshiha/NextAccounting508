-- Migration: Make invoices.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "invoices" DROP CONSTRAINT IF EXISTS "invoices_tenantId_fkey";
ALTER TABLE IF EXISTS "invoices" ADD CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "invoices" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
