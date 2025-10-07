-- attachments: backfill tenantId, add FK, set NOT NULL
BEGIN;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Backfill from ServiceRequest, Uploader(User), or Expense
UPDATE public.attachments a
SET "tenantId" = COALESCE(sr."tenantId", u."tenantId", e."tenantId")
FROM public."ServiceRequest" sr
LEFT JOIN public.users u ON u.id = a."uploaderId"
LEFT JOIN public.expenses e ON e."attachmentId" = a.id
WHERE a."tenantId" IS NULL AND (sr.id = a."serviceRequestId" OR a."uploaderId" = u.id OR e."attachmentId" = a.id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'attachments_tenantId_fkey') THEN
    EXECUTE 'ALTER TABLE public.attachments ADD CONSTRAINT attachments_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'attachments_tenantId_idx') THEN
    EXECUTE 'CREATE INDEX attachments_tenantId_idx ON public.attachments("tenantId")';
  END IF;
END$$;

DO $$
DECLARE cnt BIGINT;
BEGIN
  EXECUTE 'SELECT COUNT(*)::bigint FROM public.attachments WHERE "tenantId" IS NULL' INTO cnt;
  IF cnt = 0 THEN
    EXECUTE 'ALTER TABLE public.attachments ALTER COLUMN "tenantId" SET NOT NULL';
  END IF;
END$$;
COMMIT;
