-- Ensure ServiceRequest has clientId and serviceId columns (idempotent)
ALTER TABLE IF EXISTS "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "clientId" text,
  ADD COLUMN IF NOT EXISTS "serviceId" text;

CREATE INDEX IF NOT EXISTS "ServiceRequest_clientId_idx" ON "ServiceRequest" ("clientId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_serviceId_idx" ON "ServiceRequest" ("serviceId");

-- Optional foreign keys if target tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='clientId') THEN
    BEGIN
      ALTER TABLE "ServiceRequest" DROP CONSTRAINT IF EXISTS fk_servicerequest_client;
      ALTER TABLE "ServiceRequest" ADD CONSTRAINT fk_servicerequest_client FOREIGN KEY ("clientId") REFERENCES users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      -- ignore
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='serviceId') THEN
    BEGIN
      ALTER TABLE "ServiceRequest" DROP CONSTRAINT IF EXISTS fk_servicerequest_service;
      ALTER TABLE "ServiceRequest" ADD CONSTRAINT fk_servicerequest_service FOREIGN KEY ("serviceId") REFERENCES services(id) ON DELETE RESTRICT;
    EXCEPTION WHEN others THEN
      -- ignore
    END;
  END IF;
END$$;
