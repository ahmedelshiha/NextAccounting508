-- IdempotencyKey: change uniqueness from global key to composite (tenantId, key)
BEGIN;
-- Drop existing unique constraint on key (Prisma default name)
ALTER TABLE "IdempotencyKey" DROP CONSTRAINT IF EXISTS "IdempotencyKey_key_key";
-- Create composite unique
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_tenantId_key_unique" UNIQUE ("tenantId", "key");
COMMIT;
