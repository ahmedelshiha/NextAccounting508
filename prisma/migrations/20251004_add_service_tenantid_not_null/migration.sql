-- Migration: Make services.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "services" DROP CONSTRAINT IF EXISTS "services_tenantId_fkey";
ALTER TABLE IF EXISTS "services" ADD CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "services" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
