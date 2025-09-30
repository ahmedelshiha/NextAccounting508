-- Migration: add security_settings table

CREATE TABLE IF NOT EXISTS public.security_settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT UNIQUE,
  password_policy JSONB,
  session_security JSONB,
  two_factor JSONB,
  network JSONB,
  data_protection JSONB,
  compliance JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_security_settings_tenant ON public.security_settings(tenant_id);
