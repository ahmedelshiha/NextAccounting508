DO $mig$
DECLARE
  null_cnt bigint := 0;
  orphan_cnt bigint := 0;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'IdempotencyKey'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'IdempotencyKey' AND column_name = 'tenantId'
    ) THEN
      EXECUTE 'ALTER TABLE public."IdempotencyKey" ADD COLUMN "tenantId" TEXT';
    END IF;

    EXECUTE 'SELECT COUNT(*)::bigint FROM public."IdempotencyKey" WHERE "tenantId" IS NULL' INTO null_cnt;

    IF null_cnt = 0 THEN
      EXECUTE '
        SELECT COUNT(*)::bigint
        FROM public."IdempotencyKey" AS ik
        WHERE ik."tenantId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM public."Tenant" AS t
            WHERE t."id" = ik."tenantId"
          )
      ' INTO orphan_cnt;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = ''public''
        AND table_name = ''IdempotencyKey''
        AND constraint_name = ''idempotencykey_tenantId_fkey''
    ) THEN
      IF null_cnt = 0 AND orphan_cnt = 0 THEN
        EXECUTE 'ALTER TABLE public."IdempotencyKey" ADD CONSTRAINT idempotencykey_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
      ELSE
        RAISE NOTICE 'Skipping foreign key on IdempotencyKey.tenantId (null_cnt=%, orphan_cnt=%)', null_cnt, orphan_cnt;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'idempotencykey_tenantId_idx'
    ) THEN
      EXECUTE 'CREATE INDEX idempotencykey_tenantId_idx ON public."IdempotencyKey"("tenantId")';
    END IF;

    IF null_cnt = 0 AND orphan_cnt = 0 THEN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = ''public''
          AND table_name = ''IdempotencyKey''
          AND column_name = ''tenantId''
          AND is_nullable = ''YES''
      ) THEN
        EXECUTE 'ALTER TABLE public."IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL';
      END IF;
    ELSE
      RAISE NOTICE 'TenantId column remains nullable on IdempotencyKey (null_cnt=%, orphan_cnt=%)', null_cnt, orphan_cnt;
    END IF;
  END IF;
END
$mig$;
