-- invoices: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
BEGIN;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

UPDATE public.invoices i
SET "tenantId" = COALESCE(b."tenantId", u."tenantId")
FROM public.bookings b
LEFT JOIN public.users u ON u.id = i."clientId"
WHERE i."tenantId" IS NULL AND (b.id = i."bookingId" OR u.id = i."clientId");

ALTER TABLE public.invoices
  ADD CONSTRAINT IF NOT EXISTS invoices_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS invoices_tenantId_idx ON public.invoices("tenantId");

ALTER TABLE public.invoices ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
