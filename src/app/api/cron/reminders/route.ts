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
    // Read secret and header first. If a header is provided and mismatches the secret, reject immediately.
    const secret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET
    const header = req.headers.get('x-cron-secret') || ''
    if (secret && header && header !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // If database env is not configured, noop for safety (skip).
    const hasDbEnv = !!process.env.NETLIFY_DATABASE_URL || !!process.env.DATABASE_URL

    // When an env var exists it might still not be reachable in deploy previews (Netlify sets NETLIFY_DATABASE_URL without attaching a DB).
    // If prisma exposes a raw query function, attempt a lightweight check; on failure treat as no DB and skip.
    let hasDb = hasDbEnv
    try {
      if (hasDbEnv && typeof (prisma as any).$queryRaw === 'function') {
        await (prisma as any).$queryRaw`SELECT 1`
      }
    } catch (e) {
      hasDb = false
    }

    if (!hasDb) {
      try { await logAuditSafe({ action: 'cron:reminders:skipped', details: { reason: 'no_db' } }) } catch {}
      return NextResponse.json({ success: true, processed: 0, note: 'Database not configured; skipping reminders' })
    }

    // If DB is configured and reachable, require the secret header when a secret is configured.
    if (secret && !header) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Determine scan horizon. We only need to inspect appointments within the next 24h window.
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // First prefer scheduled reminders table if available. This allows precise scheduling and idempotency.
    let upcoming: any[] = []
    try {
      const scheduled = await prisma.scheduledReminder.findMany({
        where: { scheduledAt: { gte: now, lte: in24h }, sent: false },
        include: { serviceRequest: { include: { client: { select: { id: true, name: true, email: true } }, service: { select: { name: true } } } } },
        take: 500,
      }).catch(() => [])

      if (Array.isArray(scheduled) && scheduled.length > 0) {
        // Map scheduled reminders to unified shape expected by processing logic
        upcoming = scheduled.map((s: any) => ({
          id: s.serviceRequestId,
          scheduledAt: s.scheduledAt,
          clientPhone: s.serviceRequest?.clientPhone || s.serviceRequest?.client?.phone || null,
          tenantId: s.tenantId || s.serviceRequest?.tenantId || null,
          client: s.serviceRequest?.client || { id: null, name: '', email: '' },
          service: s.serviceRequest?.service || { name: '' },
          scheduledReminderId: s.id,
          channel: s.channel,
        }))
      }
    } catch (err) {
      upcoming = []
    }

    if (!upcoming.length) {
      // Fallback: Fetch upcoming confirmed appointments within the next 24 hours where no reminder has been sent yet.
      // Include minimal client/service data for email composition.
      upcoming = await prisma.serviceRequest.findMany({
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
    }

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

    // Read recent audit logs to compute per-tenant failure rates (best-effort)
    let perTenantFailureRate: Record<string, number> = {}
    try {
      const logs = await prisma.healthLog.findMany({
        where: { service: 'AUDIT', message: { contains: 'reminders:batch_summary' } },
        orderBy: { checkedAt: 'desc' },
        take: 20,
      })
      const agg: Record<string, { processed: number; failed: number }> = {}
      for (const l of logs) {
        try {
          const parsed = JSON.parse(String(l.message))
          const details = parsed.details || {}
          const stats = details.tenantStats || {}
          for (const t in stats) {
            const s = stats[t]
            agg[t] = agg[t] || { processed: 0, failed: 0 }
            agg[t].processed += Number(s.total || 0)
            agg[t].failed += Number(s.failed || 0)
          }
        } catch {}
      }
      for (const t of Object.keys(agg)) {
        const a = agg[t]
        perTenantFailureRate[t] = a.processed > 0 ? a.failed / a.processed : 0
      }
    } catch (e) {
      // ignore; we'll fall back to defaults
      perTenantFailureRate = {}
    }

    // Determine allowed per-tenant share using backoff rule based on recent failure rate
    const backoffThreshold = Number(process.env.REMINDERS_BACKOFF_THRESHOLD || 0.10) // start backoff above this failure rate
    const minShare = Number(process.env.REMINDERS_MIN_SHARE || 0.1) // minimum fraction allowed
    const tenantAllowed: Record<string, number> = {}

    for (const [k, arr] of byTenant.entries()) {
      const fr = perTenantFailureRate[k] ?? 0
      let factor = 1
      if (fr <= backoffThreshold) factor = 1
      else {
        // Linear reduction: as failureRate increases above threshold, reduce allowed share
        factor = Math.max(minShare, 1 - (fr - backoffThreshold) * 2)
      }
      tenantAllowed[k] = Math.max(1, Math.ceil(arr.length * factor))
    }

    // Build an interleaved processing order (round-robin) but only up to allowed per-tenant counts
    const tenantKeys = Array.from(byTenant.keys())
    const pointers: Record<string, number> = {}
    for (const k of tenantKeys) pointers[k] = 0
    const orderedAppts: any[] = []
    let remaining = tenantKeys.reduce((s, k) => s + (tenantAllowed[k] || 0), 0)
    while (remaining > 0) {
      for (const t of tenantKeys) {
        const arr = byTenant.get(t) || []
        const p = pointers[t] || 0
        const allowed = tenantAllowed[t] || 0
        if (p < allowed && arr[p]) {
          orderedAppts.push({ tenant: t, appt: arr[p] })
          pointers[t] = p + 1
          remaining--
        }
      }
      // safety break
      if (orderedAppts.length > totalAppts) break
    }

    // Record deferred counts for observability
    const deferred: Record<string, number> = {}
    for (const k of tenantKeys) {
      const arr = byTenant.get(k) || []
      deferred[k] = Math.max(0, arr.length - (tenantAllowed[k] || 0))
    }

    // Results and per-tenant telemetry
    const results: Array<{ id: string; sent: boolean; reason?: string }> = []
    const tenantStats: Record<string, { total: number; sent: number; failed: number }> = {}
    for (const k of tenantKeys) tenantStats[k] = { total: perTenantCounts[k] || 0, sent: 0, failed: 0 }

    // Tunable concurrency knobs with an in-process automatic tuner using recent telemetry
    const defaultGlobal = Number(process.env.REMINDERS_GLOBAL_CONCURRENCY || 10)
    const defaultTenant = Number(process.env.REMINDERS_TENANT_CONCURRENCY || 3)
    const maxGlobal = Number(process.env.REMINDERS_GLOBAL_CONCURRENCY_MAX || 50)
    const minGlobal = Number(process.env.REMINDERS_GLOBAL_CONCURRENCY_MIN || 2)

    // Compute global error rate (aggregate of per-tenant recent rates)
    let errorRate = 0
    try {
      const logs = await prisma.healthLog.findMany({
        where: { service: 'AUDIT', message: { contains: 'reminders:batch_summary' } },
        orderBy: { checkedAt: 'desc' },
        take: 10,
      })
      let processedSum = 0
      let failedSum = 0
      for (const l of logs) {
        try {
          const parsed = JSON.parse(String(l.message))
          const details = parsed.details || {}
          const stats = details.tenantStats || {}
          let localProcessed = Number(details.processed || 0)
          let localFailed = 0
          // aggregate failed from tenantStats if present
          for (const t in stats) {
            localFailed += Number((stats[t].failed) || 0)
          }
          processedSum += localProcessed
          failedSum += localFailed
        } catch {}
      }
      if (processedSum > 0) errorRate = failedSum / processedSum
    } catch (e) {
      errorRate = 0
    }

    // Adjust concurrency heuristics
    let effectiveGlobal = defaultGlobal
    if (errorRate > 0.10) {
      effectiveGlobal = Math.max(minGlobal, Math.floor(defaultGlobal * 0.5))
    } else if (errorRate > 0.05) {
      effectiveGlobal = Math.max(minGlobal, Math.floor(defaultGlobal * 0.75))
    } else if (errorRate < 0.02) {
      effectiveGlobal = Math.min(maxGlobal, defaultGlobal + 2)
    }

    const effectiveTenant = Math.max(1, Math.floor(defaultTenant * (errorRate > 0.10 ? 0.5 : 1)))

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

        // Mark the scheduled reminder (if used) as sent
        if ((appt as any).scheduledReminderId) {
          try { await prisma.scheduledReminder.update({ where: { id: (appt as any).scheduledReminderId }, data: { sent: true } }) } catch {}
          // After marking scheduledReminder as sent, check if there are any remaining unsent reminders for this serviceRequest
          try {
            const remaining = await prisma.scheduledReminder.count({ where: { serviceRequestId: appt.id, sent: false } }).catch(() => 0)
            if (remaining === 0) {
              try { await prisma.serviceRequest.update({ where: { id: appt.id }, data: { reminderSent: true } }) } catch {}
            }
          } catch {}
        } else {
          // Fallback for legacy flow: mark serviceRequest.reminderSent true
          try { await prisma.serviceRequest.update({ where: { id: appt.id }, data: { reminderSent: true } }) } catch {}
        }

        try { await logAuditSafe({ action: 'booking:reminder:sent', details: { serviceRequestId: appt.id, scheduledAt, reminderHours } }) } catch {}
        results.push({ id: appt.id, sent: true })
        tenantStats[tenantKey].sent++
      } catch (e) {
        await captureErrorIfAvailable(e, { route: 'cron:reminders:send', id: appt.id })
        results.push({ id: appt.id, sent: false, reason: 'error' })
        tenantStats[tenantKey].failed++
      }
    }

    // Process ordered appointments in global concurrent batches using the tuned concurrency
    const startTs = Date.now()
    for (let i = 0; i < orderedAppts.length; i += effectiveGlobal) {
      const batch = orderedAppts.slice(i, i + effectiveGlobal)
      await Promise.all(batch.map((it) => processAppointmentItem(it)))
    }

    const durationMs = Date.now() - startTs

    // Emit telemetry/audit entry summarizing the run (includes chosen effective concurrency)
    try {
      await logAuditSafe({ action: 'reminders:batch_summary', details: { totalAppts, perTenantCounts, tenantStats, processed: results.length, durationMs, effectiveGlobal, effectiveTenant, errorRate } })
    } catch {}

    return NextResponse.json({ success: true, processed: results.length, results, tenantStats, durationMs, effectiveGlobal, effectiveTenant, errorRate })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'cron:reminders' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
