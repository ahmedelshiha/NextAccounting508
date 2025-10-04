-- Migration: Make booking_settings.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "booking_settings" DROP CONSTRAINT IF EXISTS "booking_settings_tenantId_fkey";
ALTER TABLE IF EXISTS "booking_settings" ADD CONSTRAINT "booking_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "booking_settings" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
