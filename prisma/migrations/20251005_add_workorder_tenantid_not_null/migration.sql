-- WorkOrder: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
BEGIN;
ALTER TABLE public."WorkOrder" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Backfill from related entities
UPDATE public."WorkOrder" w
SET "tenantId" = COALESCE(sr."tenantId", b."tenantId", u."tenantId", s."tenantId")
FROM public."ServiceRequest" sr
LEFT JOIN public.bookings b ON b.id = w."bookingId"
LEFT JOIN public.users u ON u.id = w."clientId"
LEFT JOIN public.services s ON s.id = w."serviceId"
WHERE w."tenantId" IS NULL
  AND (sr.id = w."serviceRequestId" OR b.id = w."bookingId" OR u.id = w."clientId" OR s.id = w."serviceId");

ALTER TABLE public."WorkOrder"
  ADD CONSTRAINT IF NOT EXISTS workorder_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS workorder_tenantId_idx ON public."WorkOrder"("tenantId");

ALTER TABLE public."WorkOrder" ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
