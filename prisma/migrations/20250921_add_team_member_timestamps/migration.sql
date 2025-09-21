-- Add missing timestamp columns for team_members to align with Prisma schema
-- Safe and idempotent: uses IF EXISTS / IF NOT EXISTS

ALTER TABLE IF EXISTS "team_members"
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now();

-- Backfill nulls just in case columns existed without defaults
UPDATE "team_members" SET "createdAt" = now() WHERE "createdAt" IS NULL;
UPDATE "team_members" SET "updatedAt" = now() WHERE "updatedAt" IS NULL;
