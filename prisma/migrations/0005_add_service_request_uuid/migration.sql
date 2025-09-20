-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add uuid column if it doesn't exist, backfill, set default, not null, and unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ServiceRequest' AND column_name = 'uuid'
  ) THEN
    ALTER TABLE "ServiceRequest" ADD COLUMN "uuid" text;

    -- Backfill existing rows
    UPDATE "ServiceRequest"
    SET "uuid" = gen_random_uuid()::text
    WHERE "uuid" IS NULL;

    -- Set default for new rows
    ALTER TABLE "ServiceRequest"
      ALTER COLUMN "uuid" SET DEFAULT gen_random_uuid()::text;

    -- Enforce NOT NULL
    ALTER TABLE "ServiceRequest"
      ALTER COLUMN "uuid" SET NOT NULL;

    -- Add unique constraint (name aligned with Prisma convention)
    ALTER TABLE "ServiceRequest"
      ADD CONSTRAINT "ServiceRequest_uuid_key" UNIQUE ("uuid");
  END IF;
END
$$;
