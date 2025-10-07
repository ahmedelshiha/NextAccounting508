-- ScheduledReminder: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
-- Ensure column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ScheduledReminder') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ScheduledReminder' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public."ScheduledReminder" ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ScheduledReminder') THEN
    EXECUTE 'UPDATE public."ScheduledReminder" r SET "tenantId" = sr."tenantId" FROM public."ServiceRequest" sr WHERE r."tenantId" IS NULL AND r."serviceRequestId" = sr.id';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ScheduledReminder') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'scheduledreminder_tenantId_fkey') THEN
      EXECUTE 'ALTER TABLE public."ScheduledReminder" ADD CONSTRAINT scheduledreminder_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'scheduledreminder_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX scheduledreminder_tenantId_idx ON public."ScheduledReminder"("tenantId")';
    END IF;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ScheduledReminder') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public."ScheduledReminder" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public."ScheduledReminder" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
