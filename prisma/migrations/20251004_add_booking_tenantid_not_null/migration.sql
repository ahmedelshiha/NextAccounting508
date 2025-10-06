-- Enforce NOT NULL on bookings.tenantId if currently nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'tenantId' AND is_nullable = 'YES'
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings ALTER COLUMN "tenantId" SET NOT NULL';
  END IF;
END$$;
