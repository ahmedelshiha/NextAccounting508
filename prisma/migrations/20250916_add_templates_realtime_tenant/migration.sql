-- Migration: add tenants, templates, realtime_events and tenantId columns

BEGIN;

-- Tenants
CREATE TABLE IF NOT EXISTS "tenants" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Templates
CREATE TABLE IF NOT EXISTS "templates" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  tenant_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "templates_tenant_id_idx" ON "templates" (tenant_id);

-- Realtime events
CREATE TABLE IF NOT EXISTS "realtime_events" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "realtime_events_created_at_idx" ON "realtime_events" (created_at);

-- Add tenant_id columns to existing tables (nullable - safe rollout)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tenant_id') THEN
    ALTER TABLE "users" ADD COLUMN tenant_id TEXT;
    CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "users" (tenant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='tenant_id') THEN
    ALTER TABLE "services" ADD COLUMN tenant_id TEXT;
    CREATE INDEX IF NOT EXISTS "services_tenant_id_idx" ON "services" (tenant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_templates' AND column_name='tenant_id') THEN
    ALTER TABLE "task_templates" ADD COLUMN tenant_id TEXT;
    CREATE INDEX IF NOT EXISTS "task_templates_tenant_id_idx" ON "task_templates" (tenant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_requests' AND column_name='tenant_id') THEN
    ALTER TABLE "service_requests" ADD COLUMN tenant_id TEXT;
    CREATE INDEX IF NOT EXISTS "service_requests_tenant_id_idx" ON "service_requests" (tenant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_members' AND column_name='tenant_id') THEN
    ALTER TABLE "team_members" ADD COLUMN tenant_id TEXT;
    CREATE INDEX IF NOT EXISTS "team_members_tenant_id_idx" ON "team_members" (tenant_id);
  END IF;
END$$;

COMMIT;
