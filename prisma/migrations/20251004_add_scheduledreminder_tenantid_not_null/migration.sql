-- Migration: Make ScheduledReminder.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "ScheduledReminder" DROP CONSTRAINT IF EXISTS "scheduledreminder_tenantId_fkey";
ALTER TABLE IF EXISTS "ScheduledReminder" ADD CONSTRAINT "scheduledreminder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "ScheduledReminder" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
