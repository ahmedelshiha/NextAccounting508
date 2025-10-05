import { Handler } from '@netlify/functions'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

const MIGRATIONS = [
  'prisma/migrations/20251004_add_booking_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_servicerequest_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_service_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_workorder_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_invoice_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_expense_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_attachment_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_scheduledreminder_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_bookingsettings_tenantid_not_null/migration.sql',
  'prisma/migrations/20251004_add_idempotencykey_tenantid_not_null/migration.sql',
]

const VERIFY_TABLE: Record<string,string> = {
  'prisma/migrations/20251004_add_booking_tenantid_not_null/migration.sql': '"Booking"',
  'prisma/migrations/20251004_add_servicerequest_tenantid_not_null/migration.sql': '"ServiceRequest"',
  'prisma/migrations/20251004_add_service_tenantid_not_null/migration.sql': '"Service"',
  'prisma/migrations/20251004_add_workorder_tenantid_not_null/migration.sql': '"WorkOrder"',
  'prisma/migrations/20251004_add_invoice_tenantid_not_null/migration.sql': '"Invoice"',
  'prisma/migrations/20251004_add_expense_tenantid_not_null/migration.sql': '"Expense"',
  'prisma/migrations/20251004_add_attachment_tenantid_not_null/migration.sql': '"Attachment"',
  'prisma/migrations/20251004_add_scheduledreminder_tenantid_not_null/migration.sql': '"ScheduledReminder"',
  'prisma/migrations/20251004_add_bookingsettings_tenantid_not_null/migration.sql': '"BookingSettings"',
  'prisma/migrations/20251004_add_idempotencykey_tenantid_not_null/migration.sql': '"IdempotencyKey"',
}

// Backfill SQL steps (copied from scripts/backfill-tenant-scoped-tables.ts)
const BACKFILL_STEPS: {name:string, sql:string}[] = [
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
      UPDATE "invoices" i
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
      UPDATE "expenses" e
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
        LEFT JOIN "users" u ON u."id" = ik."userId"
        WHERE ik."tenantId" IS NULL
      )
      UPDATE "IdempotencyKey" ik
      SET "tenantId" = source.tenant_id
      FROM source
      WHERE ik."id" = source."id" AND source.tenant_id IS NOT NULL;
    `
  }
]

async function runBackfill(client: Client) {
  const results: any[] = []
  for (const step of BACKFILL_STEPS) {
    try {
      const res = await client.query(step.sql)
      const rowCount = (res as any).rowCount ?? ((res as any).rows ? (res as any).rows.length : 0)
      results.push({ name: step.name, rowCount })
    } catch (err:any) {
      results.push({ name: step.name, error: String(err) })
      // continue to next step
    }
  }
  return results
}

async function applyMigrations(client: Client) {
  const results: any[] = []
  for (const m of MIGRATIONS) {
    const abs = path.join(process.cwd(), m)
    if (!fs.existsSync(abs)) {
      results.push({ migration: m, status: 'missing' })
      continue
    }
    const sql = fs.readFileSync(abs, 'utf8')
    try {
      await client.query('BEGIN')
      // Execute migration content as a single query
      await client.query(sql)
      await client.query('COMMIT')
      // Verification
      const tbl = VERIFY_TABLE[m]
      let nullCount = null
      if (tbl) {
        const vc = await client.query(`SELECT COUNT(*)::bigint AS count FROM ${tbl} WHERE "tenantId" IS NULL`)
        nullCount = vc.rows[0]?.count ?? '0'
      }
      results.push({ migration: m, applied: true, nullCount })
    } catch (err:any) {
      await client.query('ROLLBACK')
      results.push({ migration: m, applied: false, error: String(err) })
    }
  }
  return results
}

export const handler: Handler = async (event) => {
  try {
    const secret = process.env.MIGRATE_SECRET
    if (!secret) {
      return { statusCode: 500, body: JSON.stringify({ error: 'MIGRATE_SECRET not configured in environment' }) }
    }
    const incoming = event.headers['x-migrate-secret'] || event.headers['X-MIGRATE-SECRET']
    if (!incoming || incoming !== secret) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
    if (!databaseUrl) {
      return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) }
    }

    const client = new Client({ connectionString: databaseUrl })
    await client.connect()

    const backfillResults = await runBackfill(client)
    const migrationResults = await applyMigrations(client)

    await client.end()

    return {
      statusCode: 200,
      body: JSON.stringify({ backfillResults, migrationResults }, null, 2),
    }
  } catch (err:any) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}
