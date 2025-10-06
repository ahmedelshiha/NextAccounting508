import prisma from '@/lib/prisma'

async function main(){
  console.log('Starting raw Booking tenantId backfill...')
  try{
    const rows = await prisma.$queryRawUnsafe< { booking_id: string, service_tenant: string | null, sr_tenant: string | null }[] >(
      `SELECT b.id AS booking_id, s."tenantId" AS service_tenant, sr."tenantId" AS sr_tenant
       FROM public.bookings b
       LEFT JOIN public.services s ON s.id = b."serviceId"
       LEFT JOIN public."ServiceRequest" sr ON sr.id = b."serviceRequestId"
       WHERE b."tenantId" IS NULL
       ORDER BY b."createdAt" ASC
      `
    )

    if (!rows.length) {
      console.log('No bookings require backfill. Exiting.')
      return
    }

    let updated = 0
    let unresolved = 0

    for (const r of rows) {
      const tenantId = r.sr_tenant || r.service_tenant || null
      if (!tenantId) {
        unresolved++
        console.warn('Unable to resolve tenantId for booking', { bookingId: r.booking_id })
        continue
      }

      const res = await prisma.$executeRawUnsafe(
        `UPDATE public.bookings SET "tenantId" = $1 WHERE id = $2 AND "tenantId" IS NULL`,
        tenantId,
        r.booking_id
      )
      // $executeRawUnsafe returns command tag string in PG; cannot easily get rowcount cross-DB, so increment optimistically
      updated++
    }

    const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM public.bookings WHERE "tenantId" IS NULL`)

    console.log(`Backfill completed. Updated ${updated} bookings.`)
    if (unresolved > 0) console.warn(`Unable to resolve tenantId for ${unresolved} bookings. Manual review required.`)
    console.log(`Remaining bookings without tenantId: ${count}`)

  }catch(err){
    console.error('Error during raw booking backfill:', err)
    process.exit(1)
  }finally{
    await prisma.$disconnect()
  }
}

main()
  .catch(e=>{console.error(e); process.exit(1)})
