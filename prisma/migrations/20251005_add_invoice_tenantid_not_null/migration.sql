-- invoices: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
-- Ensure column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public.invoices ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

DO $mig$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    EXECUTE $sql$
      UPDATE public.invoices
      SET "tenantId" = COALESCE(
        (SELECT b."tenantId" FROM public.bookings b WHERE b.id = public.invoices."bookingId"),
        (SELECT u."tenantId" FROM public.users u WHERE u.id = public.invoices."clientId")
      )
      WHERE public.invoices."tenantId" IS NULL
    $sql$;
  END IF;
END$mig$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_tenantId_fkey') THEN
      EXECUTE 'ALTER TABLE public.invoices ADD CONSTRAINT invoices_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoices_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX invoices_tenantId_idx ON public.invoices("tenantId")';
    END IF;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public.invoices WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public.invoices ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
