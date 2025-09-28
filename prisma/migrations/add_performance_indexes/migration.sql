-- Performance Indexes Migration
-- Purpose: Add database indexes for frequently queried fields to improve performance
-- Target fields: scheduledAt, status, serviceId, clientEmail, createdAt

-- ServiceRequest table indexes (guarded for existence, align with Prisma camelCase)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ServiceRequest') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='serviceId') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "ServiceRequest_serviceId_idx" ON "ServiceRequest" ("serviceId")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='clientEmail') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "ServiceRequest_clientEmail_idx" ON "ServiceRequest" ("clientEmail")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='status') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "ServiceRequest_status_idx" ON "ServiceRequest" ("status")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='scheduledAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "ServiceRequest_scheduledAt_idx" ON "ServiceRequest" ("scheduledAt")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='createdAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "ServiceRequest_createdAt_idx" ON "ServiceRequest" ("createdAt")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='clientId') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "ServiceRequest_clientId_idx" ON "ServiceRequest" ("clientId")';
    END IF;
  END IF;
END $$;

-- User table indexes for frequently filtered fields (guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='createdAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users" ("createdAt")';
    END IF;
  END IF;
END $$;

-- Booking table indexes (guarded, align with camelCase)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='bookings') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='serviceId') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "bookings_serviceId_idx" ON "bookings" ("serviceId")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='clientEmail') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "bookings_clientEmail_idx" ON "bookings" ("clientEmail")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='createdAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "bookings_createdAt_idx" ON "bookings" ("createdAt")';
    END IF;
  END IF;
END $$;

-- Service table indexes (guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='services') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='status') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "services_status_idx" ON "services" ("status")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='createdAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "services_createdAt_idx" ON "services" ("createdAt")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='updatedAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "services_updatedAt_idx" ON "services" ("updatedAt")';
    END IF;
  END IF;
END $$;

-- Task table indexes (guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='tasks') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='status') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='dueAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "tasks_dueAt_idx" ON "tasks" ("dueAt")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='createdAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "tasks_createdAt_idx" ON "tasks" ("createdAt")';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assigneeId') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "tasks_assigneeId_idx" ON "tasks" ("assigneeId")';
    END IF;
  END IF;
END $$;

-- Composite indexes for common query patterns (guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ServiceRequest') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='status') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRequest' AND column_name='createdAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "ServiceRequest_status_createdAt_idx" ON "ServiceRequest" ("status", "createdAt")';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='bookings') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='status') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='scheduledAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "bookings_status_scheduledAt_idx" ON "bookings" ("status", "scheduledAt")';
    END IF;
  END IF;
END $$;

-- services_active_featured_idx remains valid
CREATE INDEX IF NOT EXISTS "services_active_featured_idx" ON "services" ("active", "featured");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='tasks') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='status') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='dueAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "tasks_status_dueAt_idx" ON "tasks" ("status", "dueAt")';
    END IF;
  END IF;
END $$;

-- Contact submissions index for admin review (guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='contact_submissions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_submissions' AND column_name='responded') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_submissions' AND column_name='createdAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "contact_submissions_responded_createdAt_idx" ON "contact_submissions" ("responded", "createdAt")';
    END IF;
  END IF;
END $$;

-- Audit/activity log indexes for performance monitoring (guarded for table/column names)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='health_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_logs' AND column_name='service') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_logs' AND column_name='created_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "health_logs_service_created_at_idx" ON "health_logs" ("service", "created_at")';
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='HealthLog') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='HealthLog' AND column_name='service') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='HealthLog' AND column_name='createdAt') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS "HealthLog_service_createdAt_idx" ON "HealthLog" ("service", "createdAt")';
    END IF;
  END IF;
END $$;
