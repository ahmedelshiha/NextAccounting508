-- Ensure ServiceRequest has all expected columns from schema (idempotent)
ALTER TABLE IF EXISTS "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "budgetMin" double precision NULL,
  ADD COLUMN IF NOT EXISTS "budgetMax" double precision NULL,
  ADD COLUMN IF NOT EXISTS "deadline" timestamptz NULL,
  ADD COLUMN IF NOT EXISTS "requirements" jsonb NULL,
  ADD COLUMN IF NOT EXISTS "attachments" jsonb NULL,
  ADD COLUMN IF NOT EXISTS "assignedTeamMemberId" text NULL,
  ADD COLUMN IF NOT EXISTS "assignedAt" timestamptz NULL,
  ADD COLUMN IF NOT EXISTS "assignedBy" text NULL,
  ADD COLUMN IF NOT EXISTS "completedAt" timestamptz NULL,
  ADD COLUMN IF NOT EXISTS "clientApprovalAt" timestamptz NULL,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "uuid" text NULL,
  ADD COLUMN IF NOT EXISTS "title" text NULL,
  ADD COLUMN IF NOT EXISTS "description" text NULL,
  ADD COLUMN IF NOT EXISTS "priority" text NULL,
  ADD COLUMN IF NOT EXISTS "status" text NULL,
  ADD COLUMN IF NOT EXISTS "tenantId" text NULL;

CREATE INDEX IF NOT EXISTS "ServiceRequest_deadline_idx" ON "ServiceRequest" ("deadline");
CREATE INDEX IF NOT EXISTS "ServiceRequest_tenantId_idx" ON "ServiceRequest" ("tenantId");

-- Attempt to add simple constraints if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='uuid') THEN
    BEGIN
      ALTER TABLE "ServiceRequest" ALTER COLUMN "uuid" SET DEFAULT gen_random_uuid()::text;
    EXCEPTION WHEN others THEN
      -- ignore
    END;
  END IF;
END$$;
