-- Create CrowdinIntegration table
CREATE TABLE IF NOT EXISTS "crowdin_integrations" (
  id TEXT PRIMARY KEY,
  "tenantId" UUID NOT NULL UNIQUE,
  "projectId" VARCHAR(100) NOT NULL,
  "apiTokenMasked" VARCHAR(20) NOT NULL,
  "apiTokenEncrypted" TEXT NOT NULL,
  "autoSyncDaily" BOOLEAN NOT NULL DEFAULT true,
  "syncOnDeploy" BOOLEAN NOT NULL DEFAULT false,
  "createPrs" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncAt" TIMESTAMP NULL,
  "lastSyncStatus" VARCHAR(50) NULL,
  "testConnectionOk" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  CONSTRAINT crowdin_integrations_tenantId_key UNIQUE ("tenantId")
);

CREATE INDEX IF NOT EXISTS "crowdin_integrations_tenantId_idx" ON "crowdin_integrations"("tenantId");
