-- Migration: add-service-views
-- Date: 2025-09-24

-- 1) Add a non-nullable integer column `views` to `services` with a default of 0
ALTER TABLE IF EXISTS "services"
ADD COLUMN IF NOT EXISTS "views" integer NOT NULL DEFAULT 0;

-- 2) Create the `service_views` table to record hits (one row per view)
CREATE TABLE IF NOT EXISTS "service_views" (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  tenant_id TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_service
    FOREIGN KEY(service_id)
      REFERENCES "services"(id)
      ON DELETE CASCADE
);

-- 3) Indexes to support typical analytics queries
CREATE INDEX IF NOT EXISTS "service_views_service_id_idx" ON "service_views" (service_id);
CREATE INDEX IF NOT EXISTS "service_views_created_at_idx" ON "service_views" (created_at);
CREATE INDEX IF NOT EXISTS "service_views_service_created_idx" ON "service_views" (service_id, created_at);

-- End migration
