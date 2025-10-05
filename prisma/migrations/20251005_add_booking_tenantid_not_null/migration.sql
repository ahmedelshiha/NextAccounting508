-- bookings: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
BEGIN;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Backfill tenantId from user -> service request -> service relations
UPDATE public.bookings b
SET "tenantId" = COALESCE(u."tenantId", sr."tenantId", s."tenantId")
FROM public.users u
LEFT JOIN public."ServiceRequest" sr ON sr.id = b."serviceRequestId"
LEFT JOIN public.services s ON s.id = b."serviceId"
WHERE b."clientId" = u.id AND b."tenantId" IS NULL;

-- Add FK and index
ALTER TABLE public.bookings
  ADD CONSTRAINT IF NOT EXISTS bookings_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS bookings_tenantId_idx ON public.bookings("tenantId");

-- Enforce NOT NULL
ALTER TABLE public.bookings ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
