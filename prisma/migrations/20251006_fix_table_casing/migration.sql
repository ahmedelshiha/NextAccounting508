-- Fix table casing and remove temporary views created during backfill
DO $mig$
BEGIN
  -- Drop temporary views if they exist
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='Booking') THEN
    EXECUTE 'DROP VIEW IF EXISTS public."Booking"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='attachments') THEN
    EXECUTE 'DROP VIEW IF EXISTS public.attachments';
  END IF;

  -- Rename capitalized Attachment table to lowercase attachments if present and lowercase missing
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Attachment') AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attachments') THEN
    EXECUTE 'ALTER TABLE public."Attachment" RENAME TO attachments';
  END IF;

  -- Ensure there is a lowercase bookings table; if only a "Booking" table exists (unlikely), rename it
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Booking') AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookings') THEN
    EXECUTE 'ALTER TABLE public."Booking" RENAME TO bookings';
  END IF;
END$mig$;
