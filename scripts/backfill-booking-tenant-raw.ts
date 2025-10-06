import { disconnectPrisma, prisma, runWithTenantRLSContext } from './tenant-rls-utils'

async function main() {
  console.log('Starting raw Booking tenantId backfill...')
  try {
    const rows = await prisma.$queryRawUnsafe<
      { booking_id: string; service_tenant: string | null; sr_tenant: string | null }[]
    >(
      `SELECT b.id AS booking_id, s."tenantId" AS service_tenant, sr."tenantId" AS sr_tenant
       FROM public.bookings b
       LEFT JOIN public.services s ON s.id = b."serviceId"
       LEFT JOIN public."ServiceRequest" sr ON sr.id = b."serviceRequestId"
       WHERE b."tenantId" IS NULL
       ORDER BY b."createdAt" ASC`
    )

    if (!rows.length) {
      console.log('No bookings require backfill. Exiting.')
      return
    }

    let updated = 0
    let unresolved = 0

    for (const row of rows) {
      const tenantId = row.sr_tenant || row.service_tenant || null
      if (!tenantId) {
        unresolved++
        console.warn('Unable to resolve tenantId for booking', { bookingId: row.booking_id })
        continue
      }

      await runWithTenantRLSContext(tenantId, async (tx) => {
        await tx.$executeRawUnsafe(
          `UPDATE public.bookings SET "tenantId" = $1 WHERE id = $2 AND "tenantId" IS NULL`,
          tenantId,
          row.booking_id
        )
      })
      updated++
    }

    const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM public.bookings WHERE "tenantId" IS NULL`
    )

    console.log(`Backfill completed. Updated ${updated} bookings.`)
    if (unresolved > 0) {
      console.warn(`Unable to resolve tenantId for ${unresolved} bookings. Manual review required.`)
    }
    console.log(`Remaining bookings without tenantId: ${Number(count)}`)
  } catch (err) {
    console.error('Error during raw booking backfill:', err)
    process.exitCode = 1
  } finally {
    await disconnectPrisma()
  }
}

main().catch((error) => {
  console.error(error)
  disconnectPrisma().finally(() => process.exit(1))
})
