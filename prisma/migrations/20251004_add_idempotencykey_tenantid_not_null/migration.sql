-- Draft migration: add tenantId to IdempotencyKey and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "IdempotencyKey" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "idempotencykeys" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "idempotency_key" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_idempotencykey_tenantid ON "IdempotencyKey"("tenantId");
CREATE INDEX IF NOT EXISTS idx_idempotencykeys_tenantid ON "idempotencykeys"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='IdempotencyKey') THEN
    BEGIN
      ALTER TABLE "IdempotencyKey" ADD CONSTRAINT IF NOT EXISTS fk_idempotencykey_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='idempotencykeys') THEN
    BEGIN
      ALTER TABLE "idempotencykeys" ADD CONSTRAINT IF NOT EXISTS fk_idempotencykeys_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='IdempotencyKey') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "IdempotencyKey" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='idempotencykeys') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "idempotencykeys" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "idempotencykeys" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
