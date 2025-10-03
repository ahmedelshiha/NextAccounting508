-- Migration: add explicit legal link columns to organization_settings
-- Run with: prisma migrate deploy (or prisma migrate dev locally)

ALTER TABLE "organization_settings"
  ADD COLUMN IF NOT EXISTS "termsUrl" text;

ALTER TABLE "organization_settings"
  ADD COLUMN IF NOT EXISTS "privacyUrl" text;

ALTER TABLE "organization_settings"
  ADD COLUMN IF NOT EXISTS "refundUrl" text;

-- Optional: add indexes if you plan to query these directly
-- CREATE INDEX IF NOT EXISTS organization_settings_termsurl_idx ON "organization_settings" ("termsUrl");
-- CREATE INDEX IF NOT EXISTS organization_settings_privacyurl_idx ON "organization_settings" ("privacyUrl");
