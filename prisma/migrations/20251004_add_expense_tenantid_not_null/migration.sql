-- Draft migration: add tenantId to Expense and make NOT NULL when backfilled

ALTER TABLE IF EXISTS "Expense" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE IF EXISTS "expenses" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS idx_expense_tenantid ON "Expense"("tenantId");
CREATE INDEX IF NOT EXISTS idx_expenses_tenantid ON "expenses"("tenantId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Expense') THEN
    BEGIN
      ALTER TABLE "Expense" ADD CONSTRAINT IF NOT EXISTS fk_expense_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='expenses') THEN
    BEGIN
      ALTER TABLE "expenses" ADD CONSTRAINT IF NOT EXISTS fk_expenses_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Expense') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "Expense" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "Expense" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='expenses') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM "expenses" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE "expenses" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
