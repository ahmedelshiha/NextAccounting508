-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "timezone" VARCHAR(255) DEFAULT 'UTC',
ADD COLUMN "preferredLanguage" VARCHAR(10) DEFAULT 'en',
ADD COLUMN "bookingEmailConfirm" BOOLEAN DEFAULT true,
ADD COLUMN "bookingEmailReminder" BOOLEAN DEFAULT true,
ADD COLUMN "bookingEmailReschedule" BOOLEAN DEFAULT true,
ADD COLUMN "bookingEmailCancellation" BOOLEAN DEFAULT true,
ADD COLUMN "bookingSmsReminder" BOOLEAN DEFAULT false,
ADD COLUMN "bookingSmsConfirmation" BOOLEAN DEFAULT false,
ADD COLUMN "reminderHours" INTEGER[] DEFAULT ARRAY[24, 2];
