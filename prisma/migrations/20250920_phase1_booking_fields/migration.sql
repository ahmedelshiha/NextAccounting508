-- Phase 1: Booking fields and availability models (idempotent)

-- Create BookingType enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookingtype') THEN
    CREATE TYPE "BookingType" AS ENUM ('STANDARD','RECURRING','EMERGENCY','CONSULTATION');
  END IF;
END$$;

-- ServiceRequest booking columns
ALTER TABLE IF EXISTS "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "isBooking" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "scheduledAt" timestamptz NULL,
  ADD COLUMN IF NOT EXISTS "duration" integer NULL,
  ADD COLUMN IF NOT EXISTS "clientName" text NULL,
  ADD COLUMN IF NOT EXISTS "clientEmail" text NULL,
  ADD COLUMN IF NOT EXISTS "clientPhone" text NULL,
  ADD COLUMN IF NOT EXISTS "confirmed" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reminderSent" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "bookingType" text NULL,
  ADD COLUMN IF NOT EXISTS "recurringPattern" jsonb NULL,
  ADD COLUMN IF NOT EXISTS "parentBookingId" text NULL;

-- Ensure bookingType uses enum values when present (no strict constraint to avoid failures)

-- Indexes for ServiceRequest booking fields
CREATE INDEX IF NOT EXISTS "ServiceRequest_scheduledAt_idx" ON "ServiceRequest" ("scheduledAt");
CREATE INDEX IF NOT EXISTS "ServiceRequest_isBooking_status_idx" ON "ServiceRequest" ("isBooking", "status");

-- Service booking fields
ALTER TABLE IF EXISTS "services"
  ADD COLUMN IF NOT EXISTS "bookingEnabled" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "advanceBookingDays" integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "minAdvanceHours" integer DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "maxDailyBookings" integer NULL,
  ADD COLUMN IF NOT EXISTS "bufferTime" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "businessHours" jsonb NULL,
  ADD COLUMN IF NOT EXISTS "blackoutDates" timestamptz[] DEFAULT ARRAY[]::timestamptz[];

CREATE INDEX IF NOT EXISTS "services_active_bookingEnabled_idx" ON "services" ("active", "bookingEnabled");

-- TeamMember booking fields
ALTER TABLE IF EXISTS "team_members"
  ADD COLUMN IF NOT EXISTS "timeZone" text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS "maxConcurrentBookings" integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "bookingBuffer" integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS "autoAssign" boolean DEFAULT true;

-- AvailabilitySlot table
CREATE TABLE IF NOT EXISTS "AvailabilitySlot" (
  id text PRIMARY KEY,
  serviceId text NOT NULL,
  teamMemberId text NULL,
  date date NOT NULL,
  startTime text NOT NULL,
  endTime text NOT NULL,
  available boolean DEFAULT true,
  reason text,
  maxBookings integer DEFAULT 1,
  currentBookings integer DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS "AvailabilitySlot_unique" ON "AvailabilitySlot" (serviceId, teamMemberId, date, startTime);
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_date_service_idx" ON "AvailabilitySlot" (date, serviceId);
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_team_date_idx" ON "AvailabilitySlot" (teamMemberId, date);

-- BookingPreferences table
CREATE TABLE IF NOT EXISTS "BookingPreferences" (
  id text PRIMARY KEY,
  userId text UNIQUE NOT NULL,
  emailConfirmation boolean DEFAULT true,
  emailReminder boolean DEFAULT true,
  emailReschedule boolean DEFAULT true,
  emailCancellation boolean DEFAULT true,
  smsReminder boolean DEFAULT false,
  smsConfirmation boolean DEFAULT false,
  reminderHours integer[] DEFAULT ARRAY[24,2],
  timeZone text DEFAULT 'UTC',
  preferredLanguage text DEFAULT 'en',
  createdAt timestamptz DEFAULT now(),
  updatedAt timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "BookingPreferences_userId_idx" ON "BookingPreferences" (userId);

-- Backfill: if ServiceRequest.parentBookingId references existing ids, leave nullable

-- Safe for CI: no destructive operations included
