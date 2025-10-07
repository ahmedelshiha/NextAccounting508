const { Client } = require('pg')

async function run() {
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) {
    console.error('NETLIFY_DATABASE_URL or DATABASE_URL must be set')
    process.exit(2)
  }
  const client = new Client({ connectionString })
  await client.connect()
  try {
    console.log('Ensuring Booking.tenantId column')
    await client.query(`ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS "tenantId" TEXT`)
    console.log('Backfilling bookings.tenantId')
    await client.query(`
      UPDATE public.bookings
      SET "tenantId" = COALESCE(
        (SELECT u."tenantId" FROM public.users u WHERE u.id = public.bookings."clientId"),
        (SELECT sr."tenantId" FROM public."ServiceRequest" sr WHERE sr.id = public.bookings."serviceRequestId"),
        (SELECT s."tenantId" FROM public.services s WHERE s.id = public.bookings."serviceId")
      )
      WHERE public.bookings."tenantId" IS NULL
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS bookings_tenantId_idx ON public.bookings("tenantId")`)

    console.log('Ensuring attachments.tenantId column')
    await client.query(`ALTER TABLE IF EXISTS public.attachments ADD COLUMN IF NOT EXISTS "tenantId" TEXT`)
    // Only backfill if table exists
    const attachmentsExists = (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attachments')`)).rows[0].exists
    if (attachmentsExists) {
      console.log('Backfilling attachments.tenantId')
      await client.query(`
        UPDATE public.attachments a
        SET "tenantId" = COALESCE(sr."tenantId", u."tenantId", e."tenantId")
        FROM public."ServiceRequest" sr
        LEFT JOIN public.users u ON u.id = a."uploaderId"
        LEFT JOIN public.expenses e ON e."attachmentId" = a.id
        WHERE a."tenantId" IS NULL AND (sr.id = a."serviceRequestId" OR a."uploaderId" = u.id OR e."attachmentId" = a.id)
      `)
      await client.query(`CREATE INDEX IF NOT EXISTS attachments_tenantId_idx ON public.attachments("tenantId")`)
    } else {
      console.log('attachments table not present; skipping attachments backfill')
    }

    console.log('\nPost-backfill counts:')
    const res = await client.query(`SELECT
      (SELECT COUNT(*) FROM public.bookings) AS bookings_total,
      (SELECT COUNT(*) FROM public.bookings WHERE "tenantId" IS NULL) AS bookings_null,
      (SELECT COUNT(*) FROM public.attachments) AS attachments_total,
      (SELECT COUNT(*) FROM public.attachments WHERE "tenantId" IS NULL) AS attachments_null
    `)
    console.table(res.rows[0])
    console.log('Done')
  } catch (err) {
    console.error('Error ensuring/backfilling tenantId columns:', err)
    process.exit(1)
  } finally {
    await client.end().catch(() => {})
  }
}

run()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
