-- booking_settings: ensure tenantId exists, add FK, set NOT NULL, enforce unique, add index
-- Ensure column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_settings' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public.booking_settings ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'booking_settings_tenantId_fkey') THEN
      -- Only add FK if there are no orphan tenantIds in booking_settings
      PERFORM 1 FROM (SELECT 1 FROM (SELECT DISTINCT "tenantId" FROM public.booking_settings WHERE "tenantId" IS NOT NULL EXCEPT SELECT id FROM public."Tenant") AS orphans LIMIT 1);
      IF NOT FOUND THEN
        EXECUTE 'ALTER TABLE public.booking_settings ADD CONSTRAINT booking_settings_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'booking_settings_tenantId_unique') THEN
      EXECUTE 'CREATE UNIQUE INDEX booking_settings_tenantId_unique ON public.booking_settings("tenantId")';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'booking_settings_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX booking_settings_tenantId_idx ON public.booking_settings("tenantId")';
    END IF;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_settings') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public.booking_settings WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public.booking_settings ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
