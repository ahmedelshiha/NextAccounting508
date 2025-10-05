-- booking_settings: ensure tenantId exists, add FK, set NOT NULL, enforce unique, add index
BEGIN;
ALTER TABLE public.booking_settings ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

ALTER TABLE public.booking_settings
  ADD CONSTRAINT IF NOT EXISTS booking_settings_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS booking_settings_tenantId_unique ON public.booking_settings("tenantId");
CREATE INDEX IF NOT EXISTS booking_settings_tenantId_idx ON public.booking_settings("tenantId");

ALTER TABLE public.booking_settings ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
