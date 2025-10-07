DO $mig$
DECLARE
  null_cnt bigint := 0;
  orphan_cnt bigint := 0;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'tenantId'
    ) THEN
      EXECUTE 'ALTER TABLE public."invoices" ADD COLUMN "tenantId" TEXT';
    END IF;

    EXECUTE '
      UPDATE public."invoices" AS inv
      SET "tenantId" = (
        SELECT b."tenantId"
        FROM public."bookings" AS b
        WHERE b."id" = inv."bookingId"
          AND b."tenantId" IS NOT NULL
        LIMIT 1
      )
      WHERE inv."tenantId" IS NULL
        AND inv."bookingId" IS NOT NULL
    ';

    EXECUTE '
      UPDATE public."invoices" AS inv
      SET "tenantId" = (
        SELECT u."tenantId"
        FROM public."users" AS u
        WHERE u."id" = inv."clientId"
          AND u."tenantId" IS NOT NULL
        LIMIT 1
      )
      WHERE inv."tenantId" IS NULL
        AND inv."clientId" IS NOT NULL
    ';

    EXECUTE 'SELECT COUNT(*)::bigint FROM public."invoices" WHERE "tenantId" IS NULL' INTO null_cnt;

    IF null_cnt = 0 THEN
      EXECUTE '
        SELECT COUNT(*)::bigint
        FROM public."invoices" AS inv
        WHERE inv."tenantId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM public."Tenant" AS t
            WHERE t."id" = inv."tenantId"
          )
      ' INTO orphan_cnt;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = ''public''
        AND table_name = ''invoices''
        AND constraint_name = ''invoices_tenantId_fkey''
    ) THEN
      IF null_cnt = 0 AND orphan_cnt = 0 THEN
        EXECUTE 'ALTER TABLE public."invoices" ADD CONSTRAINT invoices_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
      ELSE
        RAISE NOTICE 'Skipping foreign key on invoices.tenantId (null_cnt=%, orphan_cnt=%)', null_cnt, orphan_cnt;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'invoices_tenantId_idx'
    ) THEN
      EXECUTE 'CREATE INDEX invoices_tenantId_idx ON public."invoices"("tenantId")';
    END IF;

    IF null_cnt = 0 AND orphan_cnt = 0 THEN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = ''public''
          AND table_name = ''invoices''
          AND column_name = ''tenantId''
          AND is_nullable = ''YES''
      ) THEN
        EXECUTE 'ALTER TABLE public."invoices" ALTER COLUMN "tenantId" SET NOT NULL';
      END IF;
    ELSE
      RAISE NOTICE 'TenantId column remains nullable on invoices (null_cnt=%, orphan_cnt=%)', null_cnt, orphan_cnt;
    END IF;
  END IF;
END
$mig$;
