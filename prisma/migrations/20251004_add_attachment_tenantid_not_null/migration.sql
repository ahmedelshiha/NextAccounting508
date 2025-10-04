-- Migration: Make Attachment.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "Attachment" DROP CONSTRAINT IF EXISTS "attachment_tenantId_fkey";
ALTER TABLE IF EXISTS "Attachment" ADD CONSTRAINT "attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "Attachment" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
