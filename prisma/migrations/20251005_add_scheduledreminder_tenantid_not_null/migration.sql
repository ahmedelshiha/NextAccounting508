-- ScheduledReminder: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
BEGIN;
ALTER TABLE public."ScheduledReminder" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

UPDATE public."ScheduledReminder" r
SET "tenantId" = sr."tenantId"
FROM public."ServiceRequest" sr
WHERE r."tenantId" IS NULL AND r."serviceRequestId" = sr.id;

ALTER TABLE public."ScheduledReminder"
  ADD CONSTRAINT IF NOT EXISTS scheduledreminder_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS scheduledreminder_tenantId_idx ON public."ScheduledReminder"("tenantId");

ALTER TABLE public."ScheduledReminder" ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
