import prisma from '@/lib/prisma'

async function main() {
  let created = 0
  let updated = 0
  let skipped = 0
  const pageSize = 200
  let cursor: string | null = null

  while (true) {
    const page = await prisma.bookingPreferences.findMany({
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      take: pageSize,
      orderBy: { id: 'asc' },
    }) as any[]

    if (!page.length) break

    for (const bp of page) {
      try {
        const existing = await prisma.userProfile.findUnique({ where: { userId: bp.userId } }) as any
        const mapped = {
          timezone: bp.timeZone || 'UTC',
          preferredLanguage: bp.preferredLanguage || 'en',
          bookingEmailConfirm: Boolean(bp.emailConfirmation),
          bookingEmailReminder: Boolean(bp.emailReminder),
          bookingEmailReschedule: Boolean(bp.emailReschedule),
          bookingEmailCancellation: Boolean(bp.emailCancellation),
          bookingSmsReminder: Boolean(bp.smsReminder),
          bookingSmsConfirmation: Boolean(bp.smsConfirmation),
          reminderHours: Array.isArray(bp.reminderHours) ? bp.reminderHours : [24, 2],
        }

        if (!existing) {
          await prisma.userProfile.create({ data: { userId: bp.userId, ...mapped } })
          created++
        } else {
          const updateData: Record<string, any> = {}
          if (!existing.timezone && mapped.timezone) updateData.timezone = mapped.timezone
          if (!existing.preferredLanguage && mapped.preferredLanguage) updateData.preferredLanguage = mapped.preferredLanguage
          if (existing.bookingEmailConfirm === null || existing.bookingEmailConfirm === undefined) updateData.bookingEmailConfirm = mapped.bookingEmailConfirm
          if (existing.bookingEmailReminder === null || existing.bookingEmailReminder === undefined) updateData.bookingEmailReminder = mapped.bookingEmailReminder
          if (existing.bookingEmailReschedule === null || existing.bookingEmailReschedule === undefined) updateData.bookingEmailReschedule = mapped.bookingEmailReschedule
          if (existing.bookingEmailCancellation === null || existing.bookingEmailCancellation === undefined) updateData.bookingEmailCancellation = mapped.bookingEmailCancellation
          if (existing.bookingSmsReminder === null || existing.bookingSmsReminder === undefined) updateData.bookingSmsReminder = mapped.bookingSmsReminder
          if (existing.bookingSmsConfirmation === null || existing.bookingSmsConfirmation === undefined) updateData.bookingSmsConfirmation = mapped.bookingSmsConfirmation
          if (!Array.isArray(existing.reminderHours) || !existing.reminderHours.length) updateData.reminderHours = mapped.reminderHours

          if (Object.keys(updateData).length > 0) {
            await prisma.userProfile.update({ where: { userId: bp.userId }, data: updateData })
            updated++
          } else {
            skipped++
          }
        }
      } catch (err) {
        // Continue on error for robustness
        console.error('Migration row failed', { userId: bp.userId, error: String(err) })
      }
    }

    cursor = page[page.length - 1].id
  }

  console.log(JSON.stringify({ ok: true, created, updated, skipped }))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
