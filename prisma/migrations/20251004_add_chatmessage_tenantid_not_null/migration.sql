-- Migration: Make chat_messages.tenantId NOT NULL and add FK to Tenant
-- PRECONDITION: Run backfill scripts before applying this migration:
--   pnpm tsx scripts/backfill-tenant-scoped-tables.ts

BEGIN;

ALTER TABLE IF EXISTS "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_tenantId_fkey";
ALTER TABLE IF EXISTS "chat_messages" ADD CONSTRAINT "chat_messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE IF EXISTS "chat_messages" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
