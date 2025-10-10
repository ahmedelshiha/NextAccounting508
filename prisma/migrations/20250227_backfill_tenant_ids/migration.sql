-- Backfill tenantId for existing rows and enforce FK
-- Create a default tenant if none exists, using deterministic id
DO $$
DECLARE v_tenant_id TEXT;
BEGIN
  -- Ensure a default tenant exists (id is arbitrary string; Prisma default(cuid()) not enforced at DB level)
  INSERT INTO "Tenant" (id, slug, name, status, "createdAt", "updatedAt")
  VALUES ('default-tenant', 'default', 'Default Tenant', 'ACTIVE', now(), now())
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_tenant_id FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1;

  -- ComplianceRecord
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ComplianceRecord' AND column_name = 'tenantId'
  ) THEN
    EXECUTE 'ALTER TABLE "ComplianceRecord" ADD COLUMN "tenantId" TEXT';
  END IF;
  EXECUTE 'UPDATE "ComplianceRecord" SET "tenantId" = $1 WHERE "tenantId" IS NULL' USING v_tenant_id;
  -- Add FK if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'ComplianceRecord' AND constraint_name = 'ComplianceRecord_tenant_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE';
  END IF;

  -- HealthLog
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'HealthLog' AND column_name = 'tenantId'
  ) THEN
    EXECUTE 'ALTER TABLE "HealthLog" ADD COLUMN "tenantId" TEXT';
  END IF;
  EXECUTE 'UPDATE "HealthLog" SET "tenantId" = $1 WHERE "tenantId" IS NULL' USING v_tenant_id;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'HealthLog' AND constraint_name = 'HealthLog_tenant_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE "HealthLog" ADD CONSTRAINT "HealthLog_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE';
  END IF;

  -- Task
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Task' AND column_name = 'tenantId'
  ) THEN
    EXECUTE 'ALTER TABLE "Task" ADD COLUMN "tenantId" TEXT';
  END IF;
  EXECUTE 'UPDATE "Task" SET "tenantId" = $1 WHERE "tenantId" IS NULL' USING v_tenant_id;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'Task' AND constraint_name = 'Task_tenant_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE "Task" ADD CONSTRAINT "Task_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE';
  END IF;
END $$;
