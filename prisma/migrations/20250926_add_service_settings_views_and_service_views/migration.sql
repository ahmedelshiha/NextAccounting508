-- Migration: add serviceSettings & views to services, and create service_views table
-- Safe, idempotent operations using IF EXISTS/IF NOT EXISTS where supported

-- 1) Ensure services table has serviceSettings (JSONB) and views (INT NOT NULL DEFAULT 0)
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "serviceSettings" JSONB;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;

-- 2) Composite unique on (tenantId, slug)
-- Drop old unique index on slug alone if present (name may vary)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname IN ('services_slug_key','Service_slug_key','services_slug_unique')
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS "services_slug_key"';
    EXECUTE 'DROP INDEX IF EXISTS "Service_slug_key"';
    EXECUTE 'DROP INDEX IF EXISTS "services_slug_unique"';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "services_tenantId_slug_key" ON "services" ("tenantId", "slug");

-- 3) Helpful indexes matching schema.prisma
CREATE INDEX IF NOT EXISTS "services_tenantId_idx" ON "services" ("tenantId");
CREATE INDEX IF NOT EXISTS "services_active_bookingEnabled_idx" ON "services" ("active", "bookingEnabled");

-- 4) service_views table for time-windowed view tracking
CREATE TABLE IF NOT EXISTS "service_views" (
  "id" TEXT PRIMARY KEY,
  "serviceId" TEXT NOT NULL,
  "tenantId" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "service_views_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_views' AND column_name = 'serviceId'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "service_views_serviceId_createdAt_idx" ON "service_views" ("serviceId", "createdAt")';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_views' AND column_name = 'service_id'
  ) THEN
    -- Legacy snake_case table (from 20250924); ensure composite index exists
    EXECUTE 'CREATE INDEX IF NOT EXISTS "service_views_service_created_idx" ON "service_views" (service_id, created_at)';
  END IF;
END $$;
