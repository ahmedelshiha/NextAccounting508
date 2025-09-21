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
        clientPhone: true,
        tenantId: true,
        client: { select: { id: true, name: true, email: true } },
        service: { select: { name: true } },
      },
      take: 500,
    })

    // Group appointments by tenant to allow balanced processing and reduce per-tenant bursts
    const byTenant = new Map<string, any[]>()
    for (const appt of upcoming) {
      const key = String(appt.tenantId || 'default')
      if (!byTenant.has(key)) byTenant.set(key, [])
      byTenant.get(key)!.push(appt)
    }

    const totalAppts = upcoming.length
    const perTenantCounts: Record<string, number> = {}
    for (const [k, v] of byTenant.entries()) perTenantCounts[k] = v.length

    // Build an interleaved processing order (round-robin) to spread tenant load
    const tenantKeys = Array.from(byTenant.keys())
    const maxLen = Math.max(...Array.from(byTenant.values()).map((a) => a.length), 0)
    const orderedAppts: any[] = []
    for (let i = 0; i < maxLen; i++) {
      for (const t of tenantKeys) {
        const arr = byTenant.get(t)!
        if (arr[i]) orderedAppts.push({ tenant: t, appt: arr[i] })
      }
    }

    // Results and per-tenant telemetry
    const results: Array<{ id: string; sent: boolean; reason?: string }> = []
    const tenantStats: Record<string, { total: number; sent: number; failed: number }> = {}
    for (const k of tenantKeys) tenantStats[k] = { total: perTenantCounts[k] || 0, sent: 0, failed: 0 }

    // Tunable concurrency knobs
    const globalConcurrency = Number(process.env.REMINDERS_GLOBAL_CONCURRENCY || 10)

    // Helper to process a single appointment (shared logic)
    async function processAppointmentItem(item: { tenant: string; appt: any }) {
      const appt = item.appt
      const tenantKey = item.tenant
      try {
        const prefs = await prisma.bookingPreferences.findUnique({ where: { userId: appt.client.id } }).catch(() => null)
        const hoursList = (prefs?.emailReminder !== false ? prefs?.reminderHours : []) ?? []
        const reminderHours = hoursList.length > 0 ? hoursList : [24, 2]

        const scheduledAt = new Date(appt.scheduledAt!)
        const msUntil = scheduledAt.getTime() - now.getTime()
        const hoursUntil = msUntil / 3_600_000
        const withinWindow = reminderHours.some((h) => Math.abs(hoursUntil - h) <= 0.25)

        if (!withinWindow) {
          results.push({ id: appt.id, sent: false, reason: 'outside_window' })
          tenantStats[tenantKey].failed++
          return
        }

        await sendBookingReminder(
          {
            id: appt.id,
            scheduledAt,
            clientName: appt.client.name || appt.client.email || 'Client',
            clientEmail: appt.client.email || '',
            service: { name: appt.service.name },
          },
          { locale: (prefs?.preferredLanguage || 'en'), timeZone: (prefs?.timeZone || undefined) }
        )

        // Optional SMS
        try {
          const smsUrl = process.env.SMS_WEBHOOK_URL
          const smsAuth = process.env.SMS_WEBHOOK_AUTH
          const wantsSms = prefs?.smsReminder === true
          if (smsUrl && wantsSms && appt.clientPhone) {
            const locale = (prefs?.preferredLanguage || 'en-US')
            const tzOpt = prefs?.timeZone ? { timeZone: prefs.timeZone } as const : undefined
            const formattedDate = new Date(scheduledAt).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', ...(tzOpt || {}) } as any)
            const formattedTime = new Date(scheduledAt).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true, ...(tzOpt || {}) } as any)
            const message = `Reminder: ${appt.service.name} on ${formattedDate} at ${formattedTime}`

            await fetch(smsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(smsAuth ? { Authorization: smsAuth } : {}),
              },
              body: JSON.stringify({
                to: appt.clientPhone,
                message,
                metadata: { serviceRequestId: appt.id, tenantId: appt.tenantId, type: 'booking-reminder' },
              }),
            })
          }
        } catch (e) {
          await captureErrorIfAvailable(e, { route: 'cron:reminders:sms', id: appt.id })
        }

        await prisma.serviceRequest.update({ where: { id: appt.id }, data: { reminderSent: true } })
        try { await logAuditSafe({ action: 'booking:reminder:sent', details: { serviceRequestId: appt.id, scheduledAt, reminderHours } }) } catch {}
        results.push({ id: appt.id, sent: true })
        tenantStats[tenantKey].sent++
      } catch (e) {
        await captureErrorIfAvailable(e, { route: 'cron:reminders:send', id: appt.id })
        results.push({ id: appt.id, sent: false, reason: 'error' })
        tenantStats[tenantKey].failed++
      }
    }

    // Process ordered appointments in global concurrent batches
    const startTs = Date.now()
    for (let i = 0; i < orderedAppts.length; i += globalConcurrency) {
      const batch = orderedAppts.slice(i, i + globalConcurrency)
      await Promise.all(batch.map((it) => processAppointmentItem(it)))
    }

    const durationMs = Date.now() - startTs

    // Emit telemetry/audit entry summarizing the run
    try {
      await logAuditSafe({ action: 'reminders:batch_summary', details: { totalAppts, perTenantCounts, tenantStats, processed: results.length, durationMs } })
    } catch {}

    return NextResponse.json({ success: true, processed: results.length, results, tenantStats, durationMs })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'cron:reminders' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
