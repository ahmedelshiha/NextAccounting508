-- Add tenantId column to services table to align with Prisma schema
-- This column is optional (NULL allowed) and indexed for multitenancy filtering

ALTER TABLE "services"
ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS "services_tenantId_idx" ON "services" ("tenantId");
