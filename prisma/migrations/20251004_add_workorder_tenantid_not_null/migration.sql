-- Draft migration: add tenantId to WorkOrder and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "WorkOrder" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "workorders" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "work_order" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_workorder_tenantid ON "WorkOrder"("tenantId");
CREATE INDEX IF NOT EXISTS idx_workorders_tenantid ON "workorders"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkOrder') THEN
    BEGIN
      ALTER TABLE "WorkOrder" ADD CONSTRAINT IF NOT EXISTS fk_workorder_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='workorders') THEN
    BEGIN
      ALTER TABLE "workorders" ADD CONSTRAINT IF NOT EXISTS fk_workorders_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='WorkOrder') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "WorkOrder" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "WorkOrder" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='workorders') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "workorders" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "workorders" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
