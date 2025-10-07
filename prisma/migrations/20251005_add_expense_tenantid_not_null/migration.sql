-- expenses: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
-- Ensure column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public.expenses ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

DO $mig$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    EXECUTE $sql$
      UPDATE public.expenses e
      SET "tenantId" = u."tenantId"
      FROM public.users u
      WHERE e."tenantId" IS NULL AND e."userId" = u.id
    $sql$;
  END IF;
END$mig$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'expenses_tenantId_fkey') THEN
      EXECUTE 'ALTER TABLE public.expenses ADD CONSTRAINT expenses_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'expenses_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX expenses_tenantId_idx ON public.expenses("tenantId")';
    END IF;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public.expenses WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public.expenses ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
