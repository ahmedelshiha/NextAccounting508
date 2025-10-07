-- Backfill IdempotencyKey.tenantId from users.userId and enforce NOT NULL when safe
DO $mig$
DECLARE cnt bigint;
BEGIN
  -- Ensure table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'IdempotencyKey') THEN
    -- Only proceed if tenantId column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'IdempotencyKey' AND column_name = 'tenantId') THEN
      -- Backfill tenantId from users table where possible
      EXECUTE '
        WITH source AS (
          SELECT ik."id", u."tenantId" AS tenant_id
          FROM public."IdempotencyKey" ik
          LEFT JOIN public."users" u ON u."id" = ik."userId"
          WHERE ik."tenantId" IS NULL
        )
        UPDATE public."IdempotencyKey" ik
        SET "tenantId" = source.tenant_id
        FROM source
        WHERE ik."id" = source."id" AND source.tenant_id IS NOT NULL
      ';
      -- If no NULLs remain, and column is currently nullable, set NOT NULL
      EXECUTE 'SELECT COUNT(*)::bigint FROM public."IdempotencyKey" WHERE "tenantId" IS NULL' INTO cnt;
      IF cnt = 0 THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = ''public'' AND table_name = ''IdempotencyKey'' AND column_name = ''tenantId'' AND is_nullable = ''YES''
        ) THEN
          EXECUTE 'ALTER TABLE public."IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL';
        END IF;
      END IF;
    END IF;
  END IF;
END
$mig$;
