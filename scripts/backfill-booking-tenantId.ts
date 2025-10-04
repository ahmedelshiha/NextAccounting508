import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Booking.tenantId backfill...')

  const batchesRaw = await prisma.booking.findMany({
    where: { tenantId: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true }
  })
  const batches = batchesRaw.map(b => ({ booking_id: b.id }))

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
        serviceRequest: { select: { tenantId: true } },
        service: { select: { tenantId: true } }
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
