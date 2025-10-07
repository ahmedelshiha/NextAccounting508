-- Enforce NOT NULL on services.tenantId if currently nullable
DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='services') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public.services WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public.services ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
