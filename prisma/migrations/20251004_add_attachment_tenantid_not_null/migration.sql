-- Draft migration: add tenantId to Attachment and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "Attachment" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "attachments" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_attachment_tenantid ON "Attachment"("tenantId");
CREATE INDEX IF NOT EXISTS idx_attachments_tenantid ON "attachments"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Attachment') THEN
    BEGIN
      ALTER TABLE "Attachment" ADD CONSTRAINT IF NOT EXISTS fk_attachment_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='attachments') THEN
    BEGIN
      ALTER TABLE "attachments" ADD CONSTRAINT IF NOT EXISTS fk_attachments_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Attachment') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "Attachment" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "Attachment" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='attachments') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "attachments" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "attachments" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
