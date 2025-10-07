-- Enforce NOT NULL on expenses.tenantId if currently nullable
-- Safe tenantId migration for expenses: ensure column, backfill from users, add FK/index guarded, enforce NOT NULL only when safe

-- Ensure tenantId column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public.expenses ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

-- Backfill from submitting user
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    EXECUTE 'UPDATE public.expenses e SET "tenantId" = (SELECT u."tenantId" FROM public.users u WHERE u.id = e."userId") WHERE e."tenantId" IS NULL';
  END IF;
END$$;

-- Add FK constraint and index if safe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'expenses_tenantId_fkey') THEN
      -- Only add FK if no orphan tenantIds
      PERFORM 1 FROM (SELECT 1 FROM (SELECT DISTINCT "tenantId" FROM public.expenses WHERE "tenantId" IS NOT NULL EXCEPT SELECT id FROM public."Tenant") AS orphans LIMIT 1);
      IF NOT FOUND THEN
        EXECUTE 'ALTER TABLE public.expenses ADD CONSTRAINT expenses_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'expenses_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX expenses_tenantId_idx ON public.expenses("tenantId")';
    END IF;
  END IF;
END$$;

-- Enforce NOT NULL only if no NULLs remain
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
