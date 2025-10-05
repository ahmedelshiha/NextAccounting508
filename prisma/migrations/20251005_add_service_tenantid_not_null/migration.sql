-- services: ensure tenantId exists, add FK, set NOT NULL, add index
BEGIN;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

ALTER TABLE public.services
  ADD CONSTRAINT IF NOT EXISTS services_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS services_tenantId_idx ON public.services("tenantId");

ALTER TABLE public.services ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
