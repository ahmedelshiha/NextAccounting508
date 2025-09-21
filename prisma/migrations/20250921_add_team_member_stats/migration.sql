-- Add missing columns to team_members to align with Prisma schema
-- Safe/Idempotent: uses IF EXISTS / IF NOT EXISTS

ALTER TABLE IF EXISTS "team_members"
  ADD COLUMN IF NOT EXISTS "workingHours" jsonb NULL,
  ADD COLUMN IF NOT EXISTS "stats" jsonb NULL;
