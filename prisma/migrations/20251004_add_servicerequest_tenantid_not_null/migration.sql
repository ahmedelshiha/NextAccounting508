-- Migration: Make ServiceRequest.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts
--   pnpm tsx scripts/backfill-booking-tenantId.ts (if applicable)

BEGIN;

ALTER TABLE IF EXISTS "ServiceRequest" DROP CONSTRAINT IF EXISTS "service_request_tenantId_fkey";
ALTER TABLE IF EXISTS "ServiceRequest" ADD CONSTRAINT "service_request_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "ServiceRequest" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
