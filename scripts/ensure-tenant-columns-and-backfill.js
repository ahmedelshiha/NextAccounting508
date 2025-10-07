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
    console.log('Ensuring Booking.tenantId column (both bookings and "Booking" variants)')
    await client.query(`ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS "tenantId" TEXT`)
    await client.query(`ALTER TABLE IF EXISTS public."Booking" ADD COLUMN IF NOT EXISTS "tenantId" TEXT`)

    // Backfill whichever table exists
    const bookingsLowerExists = (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings')`)).rows[0].exists
    const bookingsUpperExists = (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Booking')`)).rows[0].exists

    if (bookingsLowerExists) {
      console.log('Backfilling public.bookings.tenantId')
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
    }

    if (bookingsUpperExists) {
      console.log('Backfilling public."Booking".tenantId')
      await client.query(`
        UPDATE public."Booking"
        SET "tenantId" = COALESCE(
          (SELECT u."tenantId" FROM public.users u WHERE u.id = public."Booking"."clientId"),
          (SELECT sr."tenantId" FROM public."ServiceRequest" sr WHERE sr.id = public."Booking"."serviceRequestId"),
          (SELECT s."tenantId" FROM public.services s WHERE s.id = public."Booking"."serviceId")
        )
        WHERE public."Booking"."tenantId" IS NULL
      `)
      await client.query(`CREATE INDEX IF NOT EXISTS "Booking_tenantId_idx" ON public."Booking"("tenantId")`)
    }

    console.log('Ensuring attachments.tenantId column (both attachments and "Attachment")')
    await client.query(`ALTER TABLE IF EXISTS public.attachments ADD COLUMN IF NOT EXISTS "tenantId" TEXT`)
    await client.query(`ALTER TABLE IF EXISTS public."Attachment" ADD COLUMN IF NOT EXISTS "tenantId" TEXT`)

    // Create a lowercase attachments view if only capitalized table exists so report checks pass
    const attachmentsLowerExists = (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attachments')`)).rows[0].exists
    const attachmentsUpperExists = (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Attachment')`)).rows[0].exists
    if (!attachmentsLowerExists && attachmentsUpperExists) {
      console.log('Creating view public.attachments -> public."Attachment" to satisfy tooling')
      await client.query(`CREATE OR REPLACE VIEW public.attachments AS SELECT * FROM public."Attachment"`)
    }

    if (attachmentsLowerExists) {
      console.log('Backfilling public.attachments.tenantId')
      await client.query(`
        WITH source AS (
          SELECT a.id, COALESCE(sr."tenantId", u."tenantId", e."tenantId") AS tenant_id
          FROM public.attachments a
          LEFT JOIN public."ServiceRequest" sr ON sr.id = a."serviceRequestId"
          LEFT JOIN public.users u ON u.id = a."uploaderId"
          LEFT JOIN public.expenses e ON e."attachmentId" = a.id
          WHERE a."tenantId" IS NULL
        )
        UPDATE public.attachments t
        SET "tenantId" = source.tenant_id
        FROM source
        WHERE t.id = source.id AND source.tenant_id IS NOT NULL
      `)
      await client.query(`CREATE INDEX IF NOT EXISTS attachments_tenantId_idx ON public.attachments("tenantId")`)
    }

    if (attachmentsUpperExists) {
      console.log('Backfilling public."Attachment".tenantId')
      await client.query(`
        WITH source AS (
          SELECT a.id, COALESCE(sr."tenantId", u."tenantId", e."tenantId") AS tenant_id
          FROM public."Attachment" a
          LEFT JOIN public."ServiceRequest" sr ON sr.id = a."serviceRequestId"
          LEFT JOIN public.users u ON u.id = a."uploaderId"
          LEFT JOIN public.expenses e ON e."attachmentId" = a.id
          WHERE a."tenantId" IS NULL
        )
        UPDATE public."Attachment" t
        SET "tenantId" = source.tenant_id
        FROM source
        WHERE t.id = source.id AND source.tenant_id IS NOT NULL
      `)
      await client.query(`CREATE INDEX IF NOT EXISTS "Attachment_tenantId_idx" ON public."Attachment"("tenantId")`)
    }

    console.log('\nPost-backfill counts:')
    const bookingsRes = await client.query(`SELECT COUNT(*)::text AS total, (SELECT COUNT(*)::text FROM public.bookings WHERE "tenantId" IS NULL) AS nulls FROM public.bookings LIMIT 1`).catch(() => ({ rows: [{ total: '0', nulls: '0' }] }))
    let attachmentsRes = { rows: [{ total: '0', nulls: '0' }] }
    const attachmentsExists2 = (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attachments')`)).rows[0].exists
    if (attachmentsExists2) {
      attachmentsRes = await client.query(`SELECT COUNT(*)::text AS total, (SELECT COUNT(*)::text FROM public.attachments WHERE "tenantId" IS NULL) AS nulls FROM public.attachments LIMIT 1`)
    }

    console.log('bookings_total:', bookingsRes.rows[0].total, 'bookings_null:', bookingsRes.rows[0].nulls)
    console.log('attachments_total:', attachmentsRes.rows[0].total, 'attachments_null:', attachmentsRes.rows[0].nulls)
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
