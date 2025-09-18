DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname='userrole' AND e.enumlabel='STAFF'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'STAFF';
  END IF;
END $$;
