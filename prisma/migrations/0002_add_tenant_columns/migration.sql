-- Migration: add tenantId columns and related indexes to align with Prisma schema

-- Services table (mapped from model Service @@map("services"))
ALTER TABLE IF EXISTS "services"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS "services_tenantId_idx" ON "services" ("tenantId");

-- ServiceRequest table
ALTER TABLE IF EXISTS "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedTeamMemberId" TEXT;

CREATE INDEX IF NOT EXISTS "ServiceRequest_tenantId_idx" ON "ServiceRequest" ("tenantId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_tenantId_status_idx" ON "ServiceRequest" ("tenantId", "status");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ServiceRequest' AND column_name = 'assignedTeamMemberId'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "ServiceRequest_tenantId_assignedTeamMemberId_idx" ON "ServiceRequest" ("tenantId", "assignedTeamMemberId")';
  END IF;
END
$$;

-- Attachment table
ALTER TABLE IF EXISTS "Attachment"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS "Attachment_tenantId_idx" ON "Attachment" ("tenantId");
