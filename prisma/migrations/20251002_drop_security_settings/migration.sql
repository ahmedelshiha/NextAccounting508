-- Rollback migration: drop security_settings table

DROP INDEX IF EXISTS idx_security_settings_tenant;
DROP TABLE IF EXISTS public.security_settings;
