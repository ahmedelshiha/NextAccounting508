import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Booking.tenantId backfill...')

  // Prisma schema now declares tenantId as required; use raw SQL to find rows with NULL tenantId
  const rows: Array<{ id: string }> = await prisma.$queryRaw<any>`SELECT id FROM "bookings" WHERE "tenantId" IS NULL ORDER BY "createdAt" ASC`;
  const batches = rows.map(b => ({ booking_id: b.id }))

  if (!batches.length) {
    console.log('No bookings require backfill. Exiting.')
    return
  }

  let updated = 0
  let unresolved = 0

  for (const record of batches) {
    // Use raw SQL to read related tenantIds to avoid Prisma non-null type mapping issues
    const rows = await prisma.$queryRaw<any>`
      SELECT u."tenantId" AS user_tenant, s."tenantId" AS service_tenant
      FROM "bookings" b
      LEFT JOIN "users" u ON u.id = b."clientId"
      LEFT JOIN "services" s ON s.id = b."serviceId"
      WHERE b.id = ${record.booking_id}
    `;

    if (!rows || !rows.length) {
      console.warn('Booking disappeared during processing', { bookingId: record.booking_id })
      unresolved++
      continue
    }

    const row = rows[0]
    const tenantId = row.user_tenant || row.service_tenant || null

    if (!tenantId) {
      unresolved++
      console.warn('Unable to resolve tenantId for booking', { bookingId: booking.id })
      continue
    }

    const res = await prisma.booking.updateMany({
      where: { id: booking.id, tenantId: null },
      data: { tenantId }
    })

    if (res.count > 0) updated++
  }

  const remaining = await prisma.booking.count({ where: { tenantId: null } })

  console.log(`Backfill completed. Updated ${updated} bookings.`)
  if (unresolved > 0) {
    console.warn(`Unable to resolve tenantId for ${unresolved} bookings. Manual review required.`)
  }
  console.log(`Remaining bookings without tenantId: ${remaining}`)
}

main()
  .catch((error) => {
    console.error('Error during Booking tenantId backfill:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
