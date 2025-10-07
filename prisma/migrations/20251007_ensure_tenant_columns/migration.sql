-- Ensure Tenant table has expected columns from Prisma schema
DO $mig$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Tenant') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tenant' AND column_name = 'featureFlags') THEN
      EXECUTE 'ALTER TABLE public."Tenant" ADD COLUMN "featureFlags" JSONB';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tenant' AND column_name = 'metadata') THEN
      EXECUTE 'ALTER TABLE public."Tenant" ADD COLUMN "metadata" JSONB';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tenant' AND column_name = 'createdAt') THEN
      EXECUTE 'ALTER TABLE public."Tenant" ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW()';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tenant' AND column_name = 'updatedAt') THEN
      EXECUTE 'ALTER TABLE public."Tenant" ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW()';
    END IF;
  END IF;
END$mig$;
