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

ALTER TABLE public.attachments
  ADD CONSTRAINT IF NOT EXISTS attachments_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS attachments_tenantId_idx ON public.attachments("tenantId");

ALTER TABLE public.attachments ALTER COLUMN "tenantId" SET NOT NULL;
COMMIT;
