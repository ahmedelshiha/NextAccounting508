-- IdempotencyKey: ensure tenantId exists, add FK, set NOT NULL, add index
BEGIN;
ALTER TABLE public."IdempotencyKey" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

ALTER TABLE public."IdempotencyKey"
  ADD CONSTRAINT IF NOT EXISTS idempotencykey_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idempotencykey_tenantId_idx ON public."IdempotencyKey"("tenantId");

ALTER TABLE public."IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
