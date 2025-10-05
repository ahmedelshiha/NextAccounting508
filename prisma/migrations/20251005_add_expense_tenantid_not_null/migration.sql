-- expenses: ensure tenantId exists, backfill, add FK, set NOT NULL, add index
BEGIN;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

UPDATE public.expenses e
SET "tenantId" = u."tenantId"
FROM public.users u
WHERE e."tenantId" IS NULL AND e."userId" = u.id;

ALTER TABLE public.expenses
  ADD CONSTRAINT IF NOT EXISTS expenses_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS expenses_tenantId_idx ON public.expenses("tenantId");

ALTER TABLE public.expenses ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
