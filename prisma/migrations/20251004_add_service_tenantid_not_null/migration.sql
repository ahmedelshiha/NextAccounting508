-- Draft migration: add tenantId to services and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "Service" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "services" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_service_tenantid ON "Service"("tenantId");
CREATE INDEX IF NOT EXISTS idx_services_tenantid ON "services"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Service') THEN
    BEGIN
      ALTER TABLE "Service" ADD CONSTRAINT IF NOT EXISTS fk_service_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='services') THEN
    BEGIN
      ALTER TABLE "services" ADD CONSTRAINT IF NOT EXISTS fk_services_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Service') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "Service" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "Service" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='services') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "services" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "services" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
