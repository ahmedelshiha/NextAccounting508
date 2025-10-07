-- ServiceRequest: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
-- Ensure column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ServiceRequest') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ServiceRequest' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public."ServiceRequest" ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

DO $mig$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ServiceRequest') THEN
    EXECUTE $sql$
      UPDATE public."ServiceRequest"
      SET "tenantId" = COALESCE(
        (SELECT u."tenantId" FROM public.users u WHERE u.id = public."ServiceRequest"."clientId"),
        (SELECT s."tenantId" FROM public.services s WHERE s.id = public."ServiceRequest"."serviceId")
      )
      WHERE public."ServiceRequest"."tenantId" IS NULL
    $sql$;
  END IF;
END$mig$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ServiceRequest') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'servicerequest_tenantId_fkey') THEN
      -- Only add FK if there are no orphan tenantIds in ServiceRequest
      PERFORM 1 FROM (SELECT 1 FROM (SELECT DISTINCT "tenantId" FROM public."ServiceRequest" WHERE "tenantId" IS NOT NULL EXCEPT SELECT id FROM public."Tenant") AS orphans LIMIT 1);
      IF NOT FOUND THEN
        EXECUTE 'ALTER TABLE public."ServiceRequest" ADD CONSTRAINT servicerequest_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'servicerequest_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX servicerequest_tenantId_idx ON public."ServiceRequest"("tenantId")';
    END IF;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ServiceRequest') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public."ServiceRequest" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public."ServiceRequest" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
