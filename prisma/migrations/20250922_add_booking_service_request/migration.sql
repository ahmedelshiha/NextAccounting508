-- Add serviceRequestId to bookings to align with Prisma schema
-- Safe/idempotent

ALTER TABLE IF EXISTS "bookings"
  ADD COLUMN IF NOT EXISTS "serviceRequestId" text NULL;

-- Backfill existing rows with NULL (no-op)
UPDATE "bookings" SET "serviceRequestId" = NULL WHERE "serviceRequestId" IS NULL;

-- Create index for faster joins
CREATE INDEX IF NOT EXISTS "bookings_serviceRequestId_idx" ON "bookings" ("serviceRequestId");

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'bookings' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'serviceRequestId'
  ) THEN
    BEGIN
      ALTER TABLE "bookings" ADD CONSTRAINT bookings_serviceRequest_fk FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      -- ignore errors
    END;
  END IF;
END$$;
