-- IdempotencyKey: ensure tenantId exists, add FK, set NOT NULL, add index
-- Ensure column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'IdempotencyKey') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'IdempotencyKey' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public."IdempotencyKey" ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'IdempotencyKey') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'idempotencykey_tenantId_fkey') THEN
      EXECUTE 'ALTER TABLE public."IdempotencyKey" ADD CONSTRAINT idempotencykey_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idempotencykey_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX idempotencykey_tenantId_idx ON public."IdempotencyKey"("tenantId")';
    END IF;
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'IdempotencyKey') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public."IdempotencyKey" WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public."IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
