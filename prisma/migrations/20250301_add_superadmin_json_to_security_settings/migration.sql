-- Add superAdmin JSONB column to security_settings with safe defaults
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_settings' AND column_name = 'superAdmin'
  ) THEN
    ALTER TABLE "security_settings" ADD COLUMN "superAdmin" JSONB;
  END IF;
END $$;

-- Initialize defaults if NULL
UPDATE "security_settings"
SET "superAdmin" = COALESCE(
  "superAdmin",
  jsonb_build_object('stepUpMfa', false, 'logAdminAccess', true)
);
