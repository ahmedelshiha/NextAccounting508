import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Booking.tenantId backfill...')

  const batches = await prisma.$queryRaw<{ booking_id: string }[]>`
    SELECT b."id" AS booking_id
    FROM "Booking" b
    WHERE b."tenantId" IS NULL
    ORDER BY b."createdAt" ASC
  `

  if (!batches.length) {
    console.log('No bookings require backfill. Exiting.')
    return
  }

  let updated = 0
  let unresolved = 0

  for (const record of batches) {
    const booking = await prisma.booking.findUnique({
      where: { id: record.booking_id },
      select: {
        id: true,
        tenantId: true,
        serviceRequest: { select: { tenantId: true } },
        client: { select: { tenantId: true } }
      }
    })

    if (!booking) {
      console.warn('Booking disappeared during processing', { bookingId: record.booking_id })
      continue
    }

    if (booking.tenantId) continue

    const tenantId = booking.serviceRequest?.tenantId || booking.client?.tenantId || null

    if (!tenantId) {
      unresolved++
      console.warn('Unable to resolve tenantId for booking', { bookingId: booking.id })
      continue
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { tenantId }
    })

    updated++
  }

  console.log(`Backfill completed. Updated ${updated} bookings.`)
  if (unresolved > 0) {
    console.warn(`Unable to resolve tenantId for ${unresolved} bookings. Manual review required.`)
  }
}

main()
  .catch((error) => {
    console.error('Error during Booking tenantId backfill:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
