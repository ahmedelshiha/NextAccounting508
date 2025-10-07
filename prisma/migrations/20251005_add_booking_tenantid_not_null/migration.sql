-- bookings: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
-- Ensure column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public.bookings ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

-- Backfill tenantId from user -> service request -> service relations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    EXECUTE 'UPDATE public.bookings SET "tenantId" = COALESCE(u."tenantId", sr."tenantId", s."tenantId") FROM public.users u LEFT JOIN public."ServiceRequest" sr ON sr.id = public.bookings."serviceRequestId" LEFT JOIN public.services s ON s.id = public.bookings."serviceId" WHERE public.bookings."clientId" = u.id AND public.bookings."tenantId" IS NULL';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bookings_tenantId_fkey') THEN
      EXECUTE 'ALTER TABLE public.bookings ADD CONSTRAINT bookings_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bookings_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX bookings_tenantId_idx ON public.bookings("tenantId")';
    END IF;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public.bookings WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public.bookings ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
