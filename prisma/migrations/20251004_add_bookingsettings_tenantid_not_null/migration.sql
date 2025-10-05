-- Draft migration: add tenantId to BookingSettings and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "BookingSettings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "booking_settings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_bookingsettings_tenantid ON "BookingSettings"("tenantId");
CREATE INDEX IF NOT EXISTS idx_booking_settings_tenantid ON "booking_settings"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BookingSettings') THEN
    BEGIN
      ALTER TABLE "BookingSettings" ADD CONSTRAINT IF NOT EXISTS fk_bookingsettings_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='booking_settings') THEN
    BEGIN
      ALTER TABLE "booking_settings" ADD CONSTRAINT IF NOT EXISTS fk_booking_settings_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BookingSettings') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "BookingSettings" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "BookingSettings" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='booking_settings') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "booking_settings" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "booking_settings" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
