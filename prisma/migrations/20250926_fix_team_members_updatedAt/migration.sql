-- Add missing updatedAt column to team_members with a safe default
-- This allows applying the change on non-empty tables
ALTER TABLE "team_members"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Optional: keep default to auto-populate on insert; Prisma @updatedAt will handle updates.
