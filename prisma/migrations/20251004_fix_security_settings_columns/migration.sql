-- Normalize column names to match Prisma model (camelCase)

ALTER TABLE public.security_settings RENAME COLUMN tenant_id TO "tenantId";
ALTER TABLE public.security_settings RENAME COLUMN password_policy TO "passwordPolicy";
ALTER TABLE public.security_settings RENAME COLUMN session_security TO "sessionSecurity";
ALTER TABLE public.security_settings RENAME COLUMN two_factor TO "twoFactor";
ALTER TABLE public.security_settings RENAME COLUMN network TO "network"; -- stays same but ensure exists
ALTER TABLE public.security_settings RENAME COLUMN data_protection TO "dataProtection";
ALTER TABLE public.security_settings RENAME COLUMN compliance TO "compliance";
ALTER TABLE public.security_settings RENAME COLUMN created_at TO "createdAt";
ALTER TABLE public.security_settings RENAME COLUMN updated_at TO "updatedAt";

-- Recreate index on tenantId (drop old if exists)
DROP INDEX IF EXISTS idx_security_settings_tenant;
CREATE INDEX IF NOT EXISTS idx_security_settings_tenant ON public.security_settings("tenantId");
