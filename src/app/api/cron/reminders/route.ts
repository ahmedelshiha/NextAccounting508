import { NextResponse } from 'next/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendBookingReminder } from '@/lib/email'
import { captureErrorIfAvailable, logAuditSafe } from '@/lib/observability-helpers'

export const runtime = 'nodejs'

// POST /api/cron/reminders
// Protected cron endpoint that scans upcoming confirmed appointments (ServiceRequest with isBooking=true)
// and sends reminder emails based on BookingPreferences.reminderHours (defaults to [24,2]).
// Idempotency: once a reminder is sent for an appointment, reminderSent is set true to avoid duplicates.
// Auth: requires header x-cron-secret to match CRON_SECRET (or NEXT_CRON_SECRET) when configured.
export async function POST(req: Request) {
  try {
    // Protect with secret to prevent unauthorized invocations
    const secret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET
    const header = req.headers.get('x-cron-secret') || ''
    if (secret && header !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // If database is not configured, noop for safety
    const hasDb = !!process.env.NETLIFY_DATABASE_URL || !!process.env.DATABASE_URL
    if (!hasDb) {
      try { await logAuditSafe({ action: 'cron:reminders:skipped', details: { reason: 'no_db' } }) } catch {}
      return NextResponse.json({ success: true, processed: 0, note: 'Database not configured; skipping reminders' })
    }

    // Determine scan horizon. We only need to inspect appointments within the next 24h window.
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Fetch upcoming confirmed appointments within the next 24 hours where no reminder has been sent yet.
    // Include minimal client/service data for email composition.
    const upcoming = await prisma.serviceRequest.findMany({
      where: {
        isBooking: true,
        confirmed: true,
        reminderSent: false,
        scheduledAt: { gte: now, lte: in24h },
      },
      select: {
        id: true,
        scheduledAt: true,
        client: { select: { id: true, name: true, email: true } },
        service: { select: { name: true } },
      },
      take: 500,
    })

    const results: Array<{ id: string; sent: boolean; reason?: string }> = []

    for (const appt of upcoming) {
      try {
        // Resolve booking preferences for the client; default windows if none.
        const prefs = await prisma.bookingPreferences.findUnique({ where: { userId: appt.client.id } }).catch(() => null)
        const hoursList = (prefs?.emailReminder !== false ? prefs?.reminderHours : []) ?? []
        const reminderHours = hoursList.length > 0 ? hoursList : [24, 2]

        // Compute whether current time is within a window for any configured hour prior to appointment.
        // We use a +/- 15 minute tolerance to account for scheduler jitter.
        const scheduledAt = new Date(appt.scheduledAt!)
        const msUntil = scheduledAt.getTime() - now.getTime()
        const hoursUntil = msUntil / 3_600_000
        const withinWindow = reminderHours.some((h) => Math.abs(hoursUntil - h) <= 0.25) // 15 min window

        if (!withinWindow) {
          results.push({ id: appt.id, sent: false, reason: 'outside_window' })
          continue
        }

        // Compose and send reminder email (SendGrid optional; falls back to console log in dev)
        await sendBookingReminder(
          {
            id: appt.id,
            scheduledAt: scheduledAt,
            clientName: appt.client.name || appt.client.email || 'Client',
            clientEmail: appt.client.email || '',
            service: { name: appt.service.name },
          },
          { locale: (prefs?.preferredLanguage || 'en'), timeZone: (prefs?.timeZone || undefined) }
        )

        // Mark as reminded to ensure idempotency
        await prisma.serviceRequest.update({ where: { id: appt.id }, data: { reminderSent: true } })

        try { await logAuditSafe({ action: 'booking:reminder:sent', details: { serviceRequestId: appt.id, scheduledAt, reminderHours } }) } catch {}
        results.push({ id: appt.id, sent: true })
      } catch (e) {
        await captureErrorIfAvailable(e, { route: 'cron:reminders:send', id: appt.id })
        results.push({ id: appt.id, sent: false, reason: 'error' })
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'cron:reminders' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
