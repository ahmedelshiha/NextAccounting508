-- Migration: Make IdempotencyKey.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "IdempotencyKey" DROP CONSTRAINT IF EXISTS "idempotencykey_tenantId_fkey";
ALTER TABLE IF EXISTS "IdempotencyKey" ADD CONSTRAINT "idempotencykey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
