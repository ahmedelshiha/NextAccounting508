-- Migration: Make chat_messages.tenantId NOT NULL and add FK to Tenant
-- Safe tenantId migration for chat_messages
-- Backfill tenantId from users where possible, insert missing Tenants for orphan ids, then add FK/index and enforce NOT NULL only when safe

-- Ensure tenantId column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'tenantId') THEN
      EXECUTE 'ALTER TABLE public.chat_messages ADD COLUMN "tenantId" TEXT';
    END IF;
  END IF;
END$$;

-- Backfill tenantId from authoring user when available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    EXECUTE 'UPDATE public.chat_messages SET "tenantId" = (SELECT u."tenantId" FROM public.users u WHERE u.id = public.chat_messages."userId") WHERE public.chat_messages."tenantId" IS NULL';
  END IF;
END$$;

-- Insert missing Tenant rows for any remaining tenantIds (strategy: insert missing tenants)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    -- Insert tenants for any tenantIds present in chat_messages but missing from Tenant table
    EXECUTE '
      INSERT INTO public."Tenant" (id, slug, name, status)
      SELECT DISTINCT cm."tenantId" as id, cm."tenantId" as slug, (''Imported Tenant '' || cm."tenantId") as name, ''ACTIVE''::text as status
      FROM public.chat_messages cm
      WHERE cm."tenantId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public."Tenant" t WHERE t.id = cm."tenantId")
      ON CONFLICT (id) DO NOTHING
    ';
  END IF;
END$$;

-- Add FK constraint if safe (no orphan tenantIds remain)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chat_messages_tenantId_fkey') THEN
      -- Only add FK if there are no orphan tenantIds
      PERFORM 1 FROM (SELECT 1 FROM (SELECT DISTINCT "tenantId" FROM public.chat_messages WHERE "tenantId" IS NOT NULL EXCEPT SELECT id FROM public."Tenant") AS orphans LIMIT 1);
      IF NOT FOUND THEN
        EXECUTE 'ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES public."Tenant"("id") ON DELETE CASCADE';
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'chat_messages_tenantId_idx') THEN
      EXECUTE 'CREATE INDEX chat_messages_tenantId_idx ON public.chat_messages("tenantId")';
    END IF;
  END IF;
END$$;

-- Enforce NOT NULL only if no NULLs remain
DO $$
DECLARE cnt BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    EXECUTE 'SELECT COUNT(*)::bigint FROM public.chat_messages WHERE "tenantId" IS NULL' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'ALTER TABLE public.chat_messages ALTER COLUMN "tenantId" SET NOT NULL';
    END IF;
  END IF;
END$$;
