-- services: ensure tenantId exists, add FK, set NOT NULL, add index
-- Ensure column exists
DO $mig$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public.services ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

-- Backfill (noop placeholder if specific logic not present)
DO $mig$
BEGIN
  -- Intentionally left as a safe no-op; backfill handled by separate scripts if required
  NULL;
END$mig$;

DO $mig$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'services_tenantId_fkey') THEN
      -- Only add FK if there are no orphan tenantIds in services
      PERFORM 1 FROM (SELECT 1 FROM (SELECT DISTINCT "tenantId" FROM public.services WHERE "tenantId" IS NOT NULL EXCEPT SELECT id FROM public."Tenant") AS orphans LIMIT 1);
      IF NOT FOUND THEN
        EXECUTE 'ALTER TABLE public.services ADD CONSTRAINT services_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'services_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX services_tenantId_idx ON public.services("tenantId")';
    END IF;
  END IF;
END$$;

DO $mig$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public.services WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public.services ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
