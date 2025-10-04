import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type BackfillStep = {
  name: string
  sql: string
}

type RemainingCheck = {
  table: string
  column: string
}

const steps: BackfillStep[] = [
  {
    name: 'ServiceRequest from client/service relationships',
    sql: `
      WITH source AS (
        SELECT sr."id", COALESCE(u."tenantId", s."tenantId") AS tenant_id
        FROM "ServiceRequest" sr
        LEFT JOIN "users" u ON u."id" = sr."clientId"
        LEFT JOIN "services" s ON s."id" = sr."serviceId"
        WHERE sr."tenantId" IS NULL
      )
      UPDATE "ServiceRequest" sr
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE sr."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  },
  {
    name: 'WorkOrder from related entities',
    sql: `
      WITH source AS (
        SELECT w."id", COALESCE(sr."tenantId", b."tenantId", uc."tenantId") AS tenant_id
        FROM "WorkOrder" w
        LEFT JOIN "ServiceRequest" sr ON sr."id" = w."serviceRequestId"
        LEFT JOIN "bookings" b ON b."id" = w."bookingId"
        LEFT JOIN "users" uc ON uc."id" = w."clientId"
        WHERE w."tenantId" IS NULL
      )
      UPDATE "WorkOrder" w
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE w."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  },
  {
    name: 'Invoice from booking/client',
    sql: `
      WITH source AS (
        SELECT i."id", COALESCE(b."tenantId", u."tenantId") AS tenant_id
        FROM "invoices" i
        LEFT JOIN "bookings" b ON b."id" = i."bookingId"
        LEFT JOIN "users" u ON u."id" = i."clientId"
        WHERE i."tenantId" IS NULL
      )
      UPDATE "Invoice" i
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE i."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  },
  {
    name: 'Expense from submitting user',
    sql: `
      WITH source AS (
        SELECT e."id", u."tenantId" AS tenant_id
        FROM "expenses" e
        LEFT JOIN "users" u ON u."id" = e."userId"
        WHERE e."tenantId" IS NULL
      )
      UPDATE "Expense" e
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE e."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  },
  {
    name: 'Attachment from linked service request',
    sql: `
      WITH source AS (
        SELECT a."id", sr."tenantId" AS tenant_id
        FROM "Attachment" a
        LEFT JOIN "ServiceRequest" sr ON sr."id" = a."serviceRequestId"
        WHERE a."tenantId" IS NULL
      )
      UPDATE "Attachment" a
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE a."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  },
  {
    name: 'ScheduledReminder from service request',
    sql: `
      WITH source AS (
        SELECT r."id", sr."tenantId" AS tenant_id
        FROM "ScheduledReminder" r
        LEFT JOIN "ServiceRequest" sr ON sr."id" = r."serviceRequestId"
        WHERE r."tenantId" IS NULL
      )
      UPDATE "ScheduledReminder" r
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE r."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  },
  {
    name: 'ChatMessage from author',
    sql: `
      WITH source AS (
        SELECT c."id", u."tenantId" AS tenant_id
        FROM "chat_messages" c
        LEFT JOIN "users" u ON u."id" = c."userId"
        WHERE c."tenantId" IS NULL
      )
      UPDATE "chat_messages" c
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE c."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  },
  {
    name: 'BookingSettings global cleanup',
    sql: `
      WITH source AS (
        SELECT bs."id", t."id" AS tenant_id
        FROM "booking_settings" bs
        JOIN "Tenant" t ON t."id" = bs."tenantId"
        WHERE bs."tenantId" IS NULL
      )
      UPDATE "booking_settings" bs
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE bs."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  },
  {
    name: 'IdempotencyKey from user scope',
    sql: `
      WITH source AS (
        SELECT ik."id", u."tenantId" AS tenant_id
        FROM "IdempotencyKey" ik
        LEFT JOIN "User" u ON u."id" = ik."userId"
        WHERE ik."tenantId" IS NULL
      )
      UPDATE "IdempotencyKey" ik
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE ik."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  }
]

const remainingChecks: RemainingCheck[] = [
  { table: 'ServiceRequest', column: 'tenantId' },
  { table: 'WorkOrder', column: 'tenantId' },
  { table: 'Invoice', column: 'tenantId' },
  { table: 'Expense', column: 'tenantId' },
  { table: 'Attachment', column: 'tenantId' },
  { table: 'ScheduledReminder', column: 'tenantId' },
  { table: 'chat_messages', column: 'tenantId' },
  { table: 'booking_settings', column: 'tenantId' },
  { table: 'IdempotencyKey', column: 'tenantId' }
]

async function main() {
  console.log('Starting tenantId backfill for Phase 2 scoped tables...')

  for (const step of steps) {
    console.log(`Executing: ${step.name}`)
    const updated = await prisma.$executeRawUnsafe(step.sql)
    console.log(`  -> Rows updated: ${updated}`)
  }

  console.log('\nRemaining NULL counts:')
  for (const check of remainingChecks) {
    const { table, column } = check
    const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM ${table.includes('.') ? table : `"${table}"`} WHERE "${column}" IS NULL`
    )
    console.log(`  ${table}.${column}: ${count}`)
  }

  console.log('\nBackfill complete. Review tables with non-zero remaining counts for manual remediation.')
}

main()
  .catch((error) => {
    console.error('Error during tenantId backfill:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
