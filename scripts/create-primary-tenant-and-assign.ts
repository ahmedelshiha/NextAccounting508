import prisma from '@/lib/prisma'
import fs from 'fs'

async function main() {
  const tenantId = 'tenant_primary'
  const slug = 'primary'
  console.log('Creating Tenant table if missing and inserting primary tenant...')

  // Create Tenant table if it doesn't exist
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Tenant" (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      primaryDomain TEXT UNIQUE,
      description TEXT,
      featureFlags JSONB,
      metadata JSONB,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Insert primary tenant if not exists
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Tenant" (id, slug, name) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM "Tenant" WHERE slug = $2)`,
    tenantId,
    slug,
    'Primary Tenant'
  )

  // Show count of bookings with NULL tenantId
  const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM public.bookings WHERE "tenantId" IS NULL`)
  console.log(`Bookings with NULL tenantId before assign: ${count}`)

  if (Number(count) > 0) {
    console.log('Assigning NULL-tenant bookings to primary tenant...')
    await prisma.$executeRawUnsafe(`UPDATE public.bookings SET "tenantId" = $1 WHERE "tenantId" IS NULL`, tenantId)
  }

  const [{ count: after }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM public.bookings WHERE "tenantId" IS NULL`)
  console.log(`Bookings with NULL tenantId after assign: ${after}`)

  // Run backfill raw script to attempt resolution (this will mostly be no-op now)
  console.log('Running raw booking backfill script...')
  // reuse existing script logic: call the script file via import
  // Instead of importing, execute its SQL steps here to avoid circular/require issues
  try {
    const rows = await prisma.$queryRawUnsafe<{ booking_id: string, service_tenant: string | null, sr_tenant: string | null }[]>(
      `SELECT b.id AS booking_id, s."tenantId" AS service_tenant, sr."tenantId" AS sr_tenant
       FROM public.bookings b
       LEFT JOIN public.services s ON s.id = b."serviceId"
       LEFT JOIN public."ServiceRequest" sr ON sr.id = b."serviceRequestId"
       WHERE b."tenantId" IS NULL
       ORDER BY b."createdAt" ASC`
    )
    console.log(`Found ${rows.length} unresolved bookings after assign.`)
  } catch (e) {
    console.error('Error while running inline backfill check:', String(e))
  }

  // Ensure Tenant rows exist for any tenantId referenced in bookings
  try {
    const trows = await prisma.$queryRawUnsafe<{ tenantId: string | null }[]>(`SELECT DISTINCT "tenantId" FROM public.bookings WHERE "tenantId" IS NOT NULL`)
    const tenantIds = Array.from(new Set(trows.map(r => r.tenantId).filter(Boolean))) as string[]
    for (const tid of tenantIds) {
      const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT id FROM "Tenant" WHERE id = $1`, tid)
      if (!existing || existing.length === 0) {
        console.log('Inserting missing Tenant row for id:', tid)
        await prisma.$executeRawUnsafe(`INSERT INTO "Tenant" (id, slug, name) VALUES ($1, $2, $3)`, tid, tid, `Imported ${tid}`)
      }
    }
  } catch (e) {
    console.error('Failed to ensure tenant rows:', String(e))
  }

  // Apply migration SQL file if present
  try {
    const path = 'prisma/migrations/20251004_add_booking_tenantid_not_null/migration.sql'
    if (fs.existsSync(path)) {
      const sql = fs.readFileSync(path, 'utf8')
      console.log('Applying migration SQL statements (split)...')
      const parts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean)
      for (const stmt of parts) {
        // Skip empty or transaction wrappers handled by individual statements
        if (!stmt) continue
        try {
          await prisma.$executeRawUnsafe(stmt)
        } catch (err) {
          console.error('Statement failed:', stmt, String(err))
          throw err
        }
      }
      console.log('Migration SQL applied.')
    } else {
      console.log('Migration SQL file not found, skipping apply step.')
    }
  } catch (e) {
    console.error('Failed to apply migration SQL:', String(e))
  }

  await prisma.$disconnect()
}

main().catch(e=>{console.error(e); process.exit(1)})
