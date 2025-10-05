DO $$
DECLARE
  default_tenant_id text;
  organization_keep_id text;
  integration_keep_id text;
  communication_keep_id text;
  security_keep_id text;
  rec_org public."organization_settings"%ROWTYPE;
  rec_integration public."integration_settings"%ROWTYPE;
  rec_comm public."communication_settings"%ROWTYPE;
  rec_sec public."security_settings"%ROWTYPE;
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

  -- Consolidate organization settings rows before enforcing constraints
  SELECT os."id"
  INTO organization_keep_id
  FROM "organization_settings" os
  WHERE os."tenantId" = default_tenant_id
  ORDER BY os."updatedAt" DESC, os."createdAt" DESC
  LIMIT 1;

  IF organization_keep_id IS NULL THEN
    SELECT os."id"
    INTO organization_keep_id
    FROM "organization_settings" os
    WHERE os."tenantId" IS NULL
       OR NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = os."tenantId")
    ORDER BY os."updatedAt" DESC, os."createdAt" DESC
    LIMIT 1;

    IF organization_keep_id IS NOT NULL THEN
      UPDATE "organization_settings"
      SET "tenantId" = default_tenant_id
      WHERE "id" = organization_keep_id;
    END IF;
  END IF;

  IF organization_keep_id IS NULL THEN
    organization_keep_id := 'org_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24);
    INSERT INTO "organization_settings" (
      "id",
      "tenantId",
      "name",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      organization_keep_id,
      default_tenant_id,
      'Primary Tenant Organization',
      NOW(),
      NOW()
    );
  END IF;

  FOR rec_org IN
    SELECT * FROM "organization_settings" os
    WHERE os."id" <> organization_keep_id
      AND (
        os."tenantId" IS NULL
        OR NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = os."tenantId")
      )
  LOOP
    UPDATE "organization_settings"
    SET
      "name" = COALESCE("name", rec_org."name"),
      "logoUrl" = COALESCE("logoUrl", rec_org."logoUrl"),
      "tagline" = COALESCE("tagline", rec_org."tagline"),
      "description" = COALESCE("description", rec_org."description"),
      "industry" = COALESCE("industry", rec_org."industry"),
      "contactEmail" = COALESCE("contactEmail", rec_org."contactEmail"),
      "contactPhone" = COALESCE("contactPhone", rec_org."contactPhone"),
      "address" = COALESCE("address", rec_org."address"),
      "defaultTimezone" = COALESCE("defaultTimezone", rec_org."defaultTimezone"),
      "defaultCurrency" = COALESCE("defaultCurrency", rec_org."defaultCurrency"),
      "defaultLocale" = COALESCE("defaultLocale", rec_org."defaultLocale"),
      "branding" = COALESCE("branding", rec_org."branding"),
      "legalLinks" = COALESCE("legalLinks", rec_org."legalLinks"),
      "termsUrl" = COALESCE("termsUrl", rec_org."termsUrl"),
      "privacyUrl" = COALESCE("privacyUrl", rec_org."privacyUrl"),
      "refundUrl" = COALESCE("refundUrl", rec_org."refundUrl"),
      "updatedAt" = GREATEST("updatedAt", rec_org."updatedAt")
    WHERE "id" = organization_keep_id;

    DELETE FROM "organization_settings" WHERE "id" = rec_org."id";
  END LOOP;

  -- Consolidate integration settings rows
  SELECT ins."id"
  INTO integration_keep_id
  FROM "integration_settings" ins
  WHERE ins."tenantId" = default_tenant_id
  ORDER BY ins."updatedAt" DESC, ins."createdAt" DESC
  LIMIT 1;

  IF integration_keep_id IS NULL THEN
    SELECT ins."id"
    INTO integration_keep_id
    FROM "integration_settings" ins
    WHERE ins."tenantId" IS NULL
       OR NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = ins."tenantId")
    ORDER BY ins."updatedAt" DESC, ins."createdAt" DESC
    LIMIT 1;

    IF integration_keep_id IS NOT NULL THEN
      UPDATE "integration_settings"
      SET "tenantId" = default_tenant_id
      WHERE "id" = integration_keep_id;
    END IF;
  END IF;

  IF integration_keep_id IS NULL THEN
    integration_keep_id := 'int_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24);
    INSERT INTO "integration_settings" (
      "id",
      "tenantId",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      integration_keep_id,
      default_tenant_id,
      NOW(),
      NOW()
    );
  END IF;

  FOR rec_integration IN
    SELECT * FROM "integration_settings" ins
    WHERE ins."id" <> integration_keep_id
      AND (
        ins."tenantId" IS NULL
        OR NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = ins."tenantId")
      )
  LOOP
    UPDATE "integration_settings"
    SET
      "payments" = COALESCE("payments", rec_integration."payments"),
      "calendars" = COALESCE("calendars", rec_integration."calendars"),
      "comms" = COALESCE("comms", rec_integration."comms"),
      "analytics" = COALESCE("analytics", rec_integration."analytics"),
      "storage" = COALESCE("storage", rec_integration."storage"),
      "updatedAt" = GREATEST("updatedAt", rec_integration."updatedAt")
    WHERE "id" = integration_keep_id;

    DELETE FROM "integration_settings" WHERE "id" = rec_integration."id";
  END LOOP;

  -- Consolidate communication settings rows
  SELECT cs."id"
  INTO communication_keep_id
  FROM "communication_settings" cs
  WHERE cs."tenantId" = default_tenant_id
  ORDER BY cs."updatedAt" DESC, cs."createdAt" DESC
  LIMIT 1;

  IF communication_keep_id IS NULL THEN
    SELECT cs."id"
    INTO communication_keep_id
    FROM "communication_settings" cs
    WHERE cs."tenantId" IS NULL
       OR NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = cs."tenantId")
    ORDER BY cs."updatedAt" DESC, cs."createdAt" DESC
    LIMIT 1;

    IF communication_keep_id IS NOT NULL THEN
      UPDATE "communication_settings"
      SET "tenantId" = default_tenant_id
      WHERE "id" = communication_keep_id;
    END IF;
  END IF;

  IF communication_keep_id IS NULL THEN
    communication_keep_id := 'com_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24);
    INSERT INTO "communication_settings" (
      "id",
      "tenantId",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      communication_keep_id,
      default_tenant_id,
      NOW(),
      NOW()
    );
  END IF;

  FOR rec_comm IN
    SELECT * FROM "communication_settings" cs
    WHERE cs."id" <> communication_keep_id
      AND (
        cs."tenantId" IS NULL
        OR NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = cs."tenantId")
      )
  LOOP
    UPDATE "communication_settings"
    SET
      "email" = COALESCE("email", rec_comm."email"),
      "sms" = COALESCE("sms", rec_comm."sms"),
      "chat" = COALESCE("chat", rec_comm."chat"),
      "notifications" = COALESCE("notifications", rec_comm."notifications"),
      "newsletters" = COALESCE("newsletters", rec_comm."newsletters"),
      "reminders" = COALESCE("reminders", rec_comm."reminders"),
      "updatedAt" = GREATEST("updatedAt", rec_comm."updatedAt")
    WHERE "id" = communication_keep_id;

    DELETE FROM "communication_settings" WHERE "id" = rec_comm."id";
  END LOOP;

  -- Consolidate security settings rows
  SELECT ss."id"
  INTO security_keep_id
  FROM "security_settings" ss
  WHERE ss."tenantId" = default_tenant_id
  ORDER BY ss."updatedAt" DESC, ss."createdAt" DESC
  LIMIT 1;

  IF security_keep_id IS NULL THEN
    SELECT ss."id"
    INTO security_keep_id
    FROM "security_settings" ss
    WHERE ss."tenantId" IS NULL
       OR NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = ss."tenantId")
    ORDER BY ss."updatedAt" DESC, ss."createdAt" DESC
    LIMIT 1;

    IF security_keep_id IS NOT NULL THEN
      UPDATE "security_settings"
      SET "tenantId" = default_tenant_id
      WHERE "id" = security_keep_id;
    END IF;
  END IF;

  IF security_keep_id IS NULL THEN
    security_keep_id := 'sec_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24);
    INSERT INTO "security_settings" (
      "id",
      "tenantId",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      security_keep_id,
      default_tenant_id,
      NOW(),
      NOW()
    );
  END IF;

  FOR rec_sec IN
    SELECT * FROM "security_settings" ss
    WHERE ss."id" <> security_keep_id
      AND (
        ss."tenantId" IS NULL
        OR NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t."id" = ss."tenantId")
      )
  LOOP
    UPDATE "security_settings"
    SET
      "passwordPolicy" = COALESCE("passwordPolicy", rec_sec."passwordPolicy"),
      "sessionSecurity" = COALESCE("sessionSecurity", rec_sec."sessionSecurity"),
      "twoFactor" = COALESCE("twoFactor", rec_sec."twoFactor"),
      "network" = COALESCE("network", rec_sec."network"),
      "dataProtection" = COALESCE("dataProtection", rec_sec."dataProtection"),
      "compliance" = COALESCE("compliance", rec_sec."compliance"),
      "updatedAt" = GREATEST("updatedAt", rec_sec."updatedAt")
    WHERE "id" = security_keep_id;

    DELETE FROM "security_settings" WHERE "id" = rec_sec."id";
  END LOOP;
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
