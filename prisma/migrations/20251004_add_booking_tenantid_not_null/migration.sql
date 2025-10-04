-- Migration: Add NOT NULL constraint and FK with ON DELETE CASCADE for bookings.tenantId
-- IMPORTANT: Run backfill scripts BEFORE applying this migration: `pnpm tsx scripts/backfill-booking-tenantId.ts`

BEGIN;

-- Ensure the column exists (schema already has tenantId). Backfill script must populate NULLs prior to this.
-- Add / update foreign key constraint
ALTER TABLE IF EXISTS "bookings" DROP CONSTRAINT IF EXISTS "bookings_tenantId_fkey";
ALTER TABLE IF EXISTS "bookings" ADD CONSTRAINT "bookings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

-- Make tenantId NOT NULL (only safe after backfill)
ALTER TABLE IF EXISTS "bookings" ALTER COLUMN "tenantId" SET NOT NULL;

COMMIT;
