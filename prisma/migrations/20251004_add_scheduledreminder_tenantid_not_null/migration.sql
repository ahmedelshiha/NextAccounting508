-- Draft migration: add tenantId to ScheduledReminder and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "ScheduledReminder" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "scheduledreminders" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "scheduled_reminder" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_scheduledreminder_tenantid ON "ScheduledReminder"("tenantId");
CREATE INDEX IF NOT EXISTS idx_scheduledreminders_tenantid ON "scheduledreminders"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ScheduledReminder') THEN
    BEGIN
      ALTER TABLE "ScheduledReminder" ADD CONSTRAINT IF NOT EXISTS fk_scheduledreminder_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='scheduledreminders') THEN
    BEGIN
      ALTER TABLE "scheduledreminders" ADD CONSTRAINT IF NOT EXISTS fk_scheduledreminders_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ScheduledReminder') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "ScheduledReminder" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "ScheduledReminder" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='scheduledreminders') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "scheduledreminders" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "scheduledreminders" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
