DO $$
DECLARE
  default_tenant_id text;
BEGIN
  SELECT "id" INTO default_tenant_id FROM "Tenant" WHERE "slug" = 'primary' LIMIT 1;

  IF default_tenant_id IS NULL THEN
    SELECT "id" INTO default_tenant_id FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1;
  END IF;

  IF default_tenant_id IS NULL THEN
    default_tenant_id := 'tenant_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24);
    INSERT INTO "Tenant" ("id", "slug", "name", "status", "createdAt", "updatedAt")
    VALUES (default_tenant_id, 'primary', 'Primary Tenant', 'ACTIVE', NOW(), NOW());
  END IF;

  -- Backfill NULL tenantId to default
  UPDATE "organization_settings" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "integration_settings" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "communication_settings" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "security_settings" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;

  -- Fix orphan tenantIds that do not exist in Tenant
  UPDATE "organization_settings" os
    SET "tenantId" = default_tenant_id
  WHERE os."tenantId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = os."tenantId");

  UPDATE "integration_settings" ins
    SET "tenantId" = default_tenant_id
  WHERE ins."tenantId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = ins."tenantId");

  UPDATE "communication_settings" cs
    SET "tenantId" = default_tenant_id
  WHERE cs."tenantId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = cs."tenantId");

  UPDATE "security_settings" ss
    SET "tenantId" = default_tenant_id
  WHERE ss."tenantId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = ss."tenantId");
END$$;

ALTER TABLE "organization_settings"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "integration_settings"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "communication_settings"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "security_settings"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "organization_settings"
  ADD CONSTRAINT "organization_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "integration_settings"
  ADD CONSTRAINT "integration_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "communication_settings"
  ADD CONSTRAINT "communication_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "security_settings"
  ADD CONSTRAINT "security_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
