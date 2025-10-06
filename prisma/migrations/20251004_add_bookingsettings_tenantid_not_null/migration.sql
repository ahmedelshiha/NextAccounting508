-- Enforce NOT NULL on booking_settings.tenantId if currently nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_settings' AND column_name = 'tenantId' AND is_nullable = 'YES'
  ) THEN
    EXECUTE 'ALTER TABLE public.booking_settings ALTER COLUMN "tenantId" SET NOT NULL';
  END IF;
END$$;
