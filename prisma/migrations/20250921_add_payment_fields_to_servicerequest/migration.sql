-- Add payment reflection fields to ServiceRequest to match prisma/schema.prisma
-- Safe to run multiple times; uses IF NOT EXISTS and guarded blocks

DO $$
BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus",
  ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentSessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentAmountCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "paymentCurrency" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentUpdatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentAttempts" INTEGER DEFAULT 0;

-- Unique constraint for paymentSessionId (@unique in Prisma)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ServiceRequest_paymentSessionId_key'
  ) THEN
    ALTER TABLE "ServiceRequest"
      ADD CONSTRAINT "ServiceRequest_paymentSessionId_key" UNIQUE ("paymentSessionId");
  END IF;
END $$;
