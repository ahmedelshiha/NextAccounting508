DO $mig$
DECLARE
  null_cnt bigint := 0;
  orphan_cnt bigint := 0;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ScheduledReminder'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ScheduledReminder' AND column_name = 'tenantId'
    ) THEN
      EXECUTE 'ALTER TABLE public."ScheduledReminder" ADD COLUMN "tenantId" TEXT';
    END IF;

    EXECUTE '
      UPDATE public."ScheduledReminder" AS sr
      SET "tenantId" = (
        SELECT srq."tenantId"
        FROM public."ServiceRequest" AS srq
        WHERE srq."id" = sr."serviceRequestId"
          AND srq."tenantId" IS NOT NULL
        LIMIT 1
      )
      WHERE sr."tenantId" IS NULL
        AND sr."serviceRequestId" IS NOT NULL
    ';

    EXECUTE 'SELECT COUNT(*)::bigint FROM public."ScheduledReminder" WHERE "tenantId" IS NULL' INTO null_cnt;

    IF null_cnt = 0 THEN
      EXECUTE '
        SELECT COUNT(*)::bigint
        FROM public."ScheduledReminder" AS sr
        WHERE sr."tenantId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM public."Tenant" AS t
            WHERE t."id" = sr."tenantId"
          )
      ' INTO orphan_cnt;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = ''public''
        AND table_name = ''ScheduledReminder''
        AND constraint_name = ''ScheduledReminder_tenantId_fkey''
    ) THEN
      IF null_cnt = 0 AND orphan_cnt = 0 THEN
        EXECUTE 'ALTER TABLE public."ScheduledReminder" ADD CONSTRAINT "ScheduledReminder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
      ELSE
        RAISE NOTICE 'Skipping foreign key on ScheduledReminder.tenantId (null_cnt=%, orphan_cnt=%)', null_cnt, orphan_cnt;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'ScheduledReminder_tenantId_idx'
    ) THEN
      EXECUTE 'CREATE INDEX "ScheduledReminder_tenantId_idx" ON public."ScheduledReminder"("tenantId")';
    END IF;

    IF null_cnt = 0 AND orphan_cnt = 0 THEN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = ''public''
          AND table_name = ''ScheduledReminder''
          AND column_name = ''tenantId''
          AND is_nullable = ''YES''
      ) THEN
        EXECUTE 'ALTER TABLE public."ScheduledReminder" ALTER COLUMN "tenantId" SET NOT NULL';
      END IF;
    ELSE
      RAISE NOTICE 'TenantId column remains nullable on ScheduledReminder (null_cnt=%, orphan_cnt=%)', null_cnt, orphan_cnt;
    END IF;
  END IF;
END
$mig$;
