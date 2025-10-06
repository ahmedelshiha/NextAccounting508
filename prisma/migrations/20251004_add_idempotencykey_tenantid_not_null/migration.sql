-- Enforce NOT NULL on IdempotencyKey.tenantId if currently nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'IdempotencyKey' AND column_name = 'tenantId' AND is_nullable = 'YES'
  ) THEN
    EXECUTE 'ALTER TABLE public."IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL';
  END IF;
END$$;
