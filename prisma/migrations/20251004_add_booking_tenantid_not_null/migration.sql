-- Draft migration: add tenantId to bookings and make NOT NULL when backfilled

-- Add column if missing (both common table name variants)
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "bookings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Create index if missing
CREATE INDEX IF NOT EXISTS idx_booking_tenantid ON "Booking"("tenantId");
CREATE INDEX IF NOT EXISTS idx_bookings_tenantid ON "bookings"("tenantId");

-- Add foreign key constraint if not present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Booking') THEN
    BEGIN
      ALTER TABLE "Booking" ADD CONSTRAINT IF NOT EXISTS fk_booking_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='bookings') THEN
    BEGIN
      ALTER TABLE "bookings" ADD CONSTRAINT IF NOT EXISTS fk_bookings_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

-- Set NOT NULL only if there are no NULL tenantId rows
DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Booking') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "Booking" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "Booking" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='bookings') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "bookings" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "bookings" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
