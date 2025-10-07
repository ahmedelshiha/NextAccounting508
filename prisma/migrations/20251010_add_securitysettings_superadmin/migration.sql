-- Add superAdmin JSON column to security_settings and set default values for existing rows
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS "superAdmin" jsonb;

-- Set default object for existing rows where null
UPDATE public.security_settings
SET "superAdmin" = ('{"stepUpMfa": false, "logAdminAccess": true}'::jsonb)
WHERE "superAdmin" IS NULL;

-- Ensure future inserts can omit the column (nullable)
-- No further actions required.
