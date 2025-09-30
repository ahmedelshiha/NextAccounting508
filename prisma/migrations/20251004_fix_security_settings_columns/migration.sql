-- Idempotent rename: only rename if source column exists and target does not.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'tenant_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'tenantId') THEN
    EXECUTE 'ALTER TABLE public.security_settings RENAME COLUMN tenant_id TO "tenantId"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'password_policy') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'passwordPolicy') THEN
    EXECUTE 'ALTER TABLE public.security_settings RENAME COLUMN password_policy TO "passwordPolicy"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'session_security') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'sessionSecurity') THEN
    EXECUTE 'ALTER TABLE public.security_settings RENAME COLUMN session_security TO "sessionSecurity"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'two_factor') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'twoFactor') THEN
    EXECUTE 'ALTER TABLE public.security_settings RENAME COLUMN two_factor TO "twoFactor"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'data_protection') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'dataProtection') THEN
    EXECUTE 'ALTER TABLE public.security_settings RENAME COLUMN data_protection TO "dataProtection"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'created_at') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'createdAt') THEN
    EXECUTE 'ALTER TABLE public.security_settings RENAME COLUMN created_at TO "createdAt"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'updated_at') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_settings' AND column_name = 'updatedAt') THEN
    EXECUTE 'ALTER TABLE public.security_settings RENAME COLUMN updated_at TO "updatedAt"';
  END IF;
END$$;

-- Recreate index on tenantId (drop old if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'security_settings' AND indexname = 'idx_security_settings_tenant') THEN
    EXECUTE 'DROP INDEX IF EXISTS idx_security_settings_tenant';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'security_settings' AND indexname = 'idx_security_settings_tenant') THEN
    EXECUTE 'CREATE INDEX idx_security_settings_tenant ON public.security_settings("tenantId")';
  END IF;
END$$;
