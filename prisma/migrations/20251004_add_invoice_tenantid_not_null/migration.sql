-- Draft migration: add tenantId to Invoice and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "Invoice" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "invoices" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_invoice_tenantid ON "Invoice"("tenantId");
CREATE INDEX IF NOT EXISTS idx_invoices_tenantid ON "invoices"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Invoice') THEN
    BEGIN
      ALTER TABLE "Invoice" ADD CONSTRAINT IF NOT EXISTS fk_invoice_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='invoices') THEN
    BEGIN
      ALTER TABLE "invoices" ADD CONSTRAINT IF NOT EXISTS fk_invoices_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Invoice') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "Invoice" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "Invoice" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='invoices') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "invoices" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "invoices" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
