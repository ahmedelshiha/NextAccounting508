UPDATE public.security_settings
SET "superAdmin" = COALESCE("superAdmin", '{"stepUpMfa": false, "logAdminAccess": true}'::jsonb);
