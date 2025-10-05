-- ServiceRequest: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
BEGIN;
ALTER TABLE public."ServiceRequest" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Backfill from client or service
UPDATE public."ServiceRequest" sr
SET "tenantId" = COALESCE(u."tenantId", s."tenantId")
FROM public.users u
LEFT JOIN public.services s ON s.id = sr."serviceId"
WHERE sr."clientId" = u.id AND sr."tenantId" IS NULL;

-- Add FK and index
ALTER TABLE public."ServiceRequest"
  ADD CONSTRAINT IF NOT EXISTS servicerequest_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS servicerequest_tenantId_idx ON public."ServiceRequest"("tenantId");

-- Enforce NOT NULL
ALTER TABLE public."ServiceRequest" ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
