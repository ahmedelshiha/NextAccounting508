-- Migration: add Attachment model and enum types

-- Create enum types if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'postpriority') THEN
    CREATE TYPE "PostPriority" AS ENUM ('LOW','MEDIUM','HIGH');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookingstatus') THEN
    CREATE TYPE "BookingStatus" AS ENUM ('PENDING','CONFIRMED','COMPLETED','CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskpriority') THEN
    CREATE TYPE "TaskPriority" AS ENUM ('LOW','MEDIUM','HIGH');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskstatus') THEN
    CREATE TYPE "TaskStatus" AS ENUM ('OPEN','IN_PROGRESS','REVIEW','COMPLETED','BLOCKED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
    CREATE TYPE "UserRole" AS ENUM ('CLIENT','TEAM_MEMBER','TEAM_LEAD','ADMIN');
  END IF;
END$$;

-- Create Attachment table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Attachment" (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE,
  url TEXT,
  name TEXT,
  size INTEGER,
  contentType TEXT,
  avStatus TEXT,
  avDetails JSONB,
  provider TEXT,
  uploadedAt TIMESTAMPTZ DEFAULT now(),
  uploaderId TEXT,
  serviceRequestId TEXT
);

-- Optional: create indexes consistent with Prisma model
CREATE INDEX IF NOT EXISTS "idx_attachment_service_request" ON "Attachment" (serviceRequestId);

-- Optional: add foreign key constraints if referenced tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    BEGIN
      ALTER TABLE "Attachment" DROP CONSTRAINT IF EXISTS fk_attachment_uploader;
      ALTER TABLE "Attachment" ADD CONSTRAINT fk_attachment_uploader FOREIGN KEY (uploaderId) REFERENCES users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      -- ignore
    END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ServiceRequest') THEN
    BEGIN
      ALTER TABLE "Attachment" DROP CONSTRAINT IF EXISTS fk_attachment_service_request;
      ALTER TABLE "Attachment" ADD CONSTRAINT fk_attachment_service_request FOREIGN KEY (serviceRequestId) REFERENCES "ServiceRequest"(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      -- ignore
    END;
  END IF;
END$$;
