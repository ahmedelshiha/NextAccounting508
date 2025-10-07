-- Add primaryDomain column to Tenant if missing
DO $mig$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Tenant') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tenant' AND column_name = 'primaryDomain') THEN
      EXECUTE 'ALTER TABLE public."Tenant" ADD COLUMN "primaryDomain" TEXT';
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS tenant_primaryDomain_unique ON public."Tenant" ("primaryDomain")';
    END IF;
  END IF;
END$mig$;
