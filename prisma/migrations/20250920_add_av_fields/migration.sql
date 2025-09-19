-- Migration: add avScanAt, avThreatName, avScanTime to attachments
-- NOTE: Run this via `pnpm prisma migrate deploy` in CI or `pnpm prisma migrate dev --name add-av-fields` locally.

ALTER TABLE IF EXISTS "Attachment"
  ADD COLUMN IF NOT EXISTS "avScanAt" TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE IF EXISTS "Attachment"
  ADD COLUMN IF NOT EXISTS "avThreatName" TEXT NULL;

ALTER TABLE IF EXISTS "Attachment"
  ADD COLUMN IF NOT EXISTS "avScanTime" DOUBLE PRECISION NULL;
