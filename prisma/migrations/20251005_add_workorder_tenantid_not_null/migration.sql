-- WorkOrder: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
-- Ensure column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WorkOrder') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkOrder' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public."WorkOrder" ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

-- Backfill from related entities
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WorkOrder') THEN
    EXECUTE 'UPDATE public."WorkOrder" SET "tenantId" = COALESCE((SELECT sr."tenantId" FROM public."ServiceRequest" sr WHERE sr.id = public."WorkOrder"."serviceRequestId"), (SELECT b."tenantId" FROM public.bookings b WHERE b.id = public."WorkOrder"."bookingId"), (SELECT u."tenantId" FROM public.users u WHERE u.id = public."WorkOrder"."clientId"), (SELECT s."tenantId" FROM public.services s WHERE s.id = public."WorkOrder"."serviceId")) WHERE public."WorkOrder"."tenantId" IS NULL';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WorkOrder') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'workorder_tenantId_fkey') THEN
      EXECUTE 'ALTER TABLE public."WorkOrder" ADD CONSTRAINT workorder_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'workorder_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX workorder_tenantId_idx ON public."WorkOrder"("tenantId")';
    END IF;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WorkOrder') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public."WorkOrder" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public."WorkOrder" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
