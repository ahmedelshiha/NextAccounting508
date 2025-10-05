-- Draft migration: add tenantId to ServiceRequest and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "ServiceRequest" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "service_requests" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "serviceRequest" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_servicerequest_tenantid ON "ServiceRequest"("tenantId");
CREATE INDEX IF NOT EXISTS idx_service_requests_tenantid ON "service_requests"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ServiceRequest') THEN
    BEGIN
      ALTER TABLE "ServiceRequest" ADD CONSTRAINT IF NOT EXISTS fk_servicerequest_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='service_requests') THEN
    BEGIN
      ALTER TABLE "service_requests" ADD CONSTRAINT IF NOT EXISTS fk_service_requests_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ServiceRequest') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "ServiceRequest" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "ServiceRequest" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='service_requests') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "service_requests" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "service_requests" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
