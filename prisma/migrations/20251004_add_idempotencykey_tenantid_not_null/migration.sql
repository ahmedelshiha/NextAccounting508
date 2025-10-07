DO $mig$
DECLARE
  null_cnt bigint := 0;
  invalid_cnt bigint := 0;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'IdempotencyKey'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'IdempotencyKey' AND column_name = 'tenantId'
    ) THEN
      EXECUTE '
        UPDATE public."IdempotencyKey" AS ik
        SET "tenantId" = (
          SELECT u."tenantId"
          FROM public."users" AS u
          WHERE u."id" = ik."userId"
          LIMIT 1
        )
        WHERE ik."tenantId" IS NULL
          AND EXISTS (
            SELECT 1
            FROM public."users" AS u_check
            WHERE u_check."id" = ik."userId"
              AND u_check."tenantId" IS NOT NULL
          )
      ';

      EXECUTE 'SELECT COUNT(*)::bigint FROM public."IdempotencyKey" WHERE "tenantId" IS NULL' INTO null_cnt;

      IF null_cnt = 0 THEN
        EXECUTE '
          SELECT COUNT(*)::bigint
          FROM public."IdempotencyKey" AS ik
          WHERE NOT EXISTS (
            SELECT 1
            FROM public."Tenant" AS t
            WHERE t."id" = ik."tenantId"
          )
        ' INTO invalid_cnt;

        IF invalid_cnt = 0 THEN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = ''public'' AND table_name = ''IdempotencyKey'' AND column_name = ''tenantId'' AND is_nullable = ''YES''
          ) THEN
            EXECUTE 'ALTER TABLE public."IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL';
          END IF;
        ELSE
          RAISE NOTICE 'Skipping NOT NULL enforcement on IdempotencyKey.tenantId due to % orphan tenant references', invalid_cnt;
        END IF;
      END IF;
    END IF;
  END IF;
END
$mig$;
