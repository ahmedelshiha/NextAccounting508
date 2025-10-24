import prisma from '@/lib/prisma'

async function main() {
  let created = 0
  let updated = 0
  const pageSize = 200
  let cursor: string | null = null

  while (true) {
    const page = await prisma.userProfile.findMany({
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      take: pageSize,
      orderBy: { id: 'asc' },
    }) as any[]

    if (!page.length) break

    for (const up of page) {
      try {
        const mapped = {
          emailConfirmation: up.bookingEmailConfirm ?? true,
          emailReminder: up.bookingEmailReminder ?? true,
          emailReschedule: up.bookingEmailReschedule ?? true,
          emailCancellation: up.bookingEmailCancellation ?? true,
          smsReminder: up.bookingSmsReminder ?? false,
          smsConfirmation: up.bookingSmsConfirmation ?? false,
          reminderHours: Array.isArray(up.reminderHours) && up.reminderHours.length ? up.reminderHours : [24, 2],
          timeZone: up.timezone || 'UTC',
          preferredLanguage: up.preferredLanguage || 'en',
        }
        const existing = await prisma.bookingPreferences.findUnique({ where: { userId: up.userId } }) as any
        if (!existing) {
          await prisma.bookingPreferences.create({ data: { userId: up.userId, ...mapped } })
          created++
        } else {
          await prisma.bookingPreferences.update({ where: { userId: up.userId }, data: mapped })
          updated++
        }
      } catch (err) {
        console.error('Rollback row failed', { userId: up.userId, error: String(err) })
      }
    }

    cursor = page[page.length - 1].id
  }

  console.log(JSON.stringify({ ok: true, created, updated }))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
