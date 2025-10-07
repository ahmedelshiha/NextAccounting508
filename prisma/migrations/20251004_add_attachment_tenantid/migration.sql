-- Ensure Attachment.tenantId column exists, backfill from related entities, add FK and index
DO $$
BEGIN
  -- Add column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Attachment' AND column_name = 'tenantId'
  ) THEN
    EXECUTE 'ALTER TABLE public."Attachment" ADD COLUMN "tenantId" TEXT';
  END IF;

  -- Backfill from ServiceRequest when available
  EXECUTE $sql$
    UPDATE public."Attachment" a
    SET "tenantId" = sr."tenantId"
    FROM public."ServiceRequest" sr
    WHERE a."serviceRequestId" = sr."id" AND a."tenantId" IS NULL;
  $sql$;

  -- Backfill from uploader User if available
  EXECUTE $sql$
    UPDATE public."Attachment" a
    SET "tenantId" = u."tenantId"
    FROM public.users u
    WHERE a."uploaderId" = u."id" AND a."tenantId" IS NULL;
  $sql$;

  -- Add FK constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'Attachment' AND tc.constraint_name = 'attachments_tenantid_fkey'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public."Attachment" ADD CONSTRAINT attachments_tenantid_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
    EXCEPTION WHEN others THEN
      -- ignore if cannot add (will surface on apply)
      RAISE NOTICE 'Could not add attachments_tenantid_fkey: %', SQLERRM;
    END;
  END IF;

  -- Create index on tenantId if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attachment_tenant'
  ) THEN
    EXECUTE 'CREATE INDEX idx_attachment_tenant ON public."Attachment"("tenantId")';
  END IF;
END$$;
