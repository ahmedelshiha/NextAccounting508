import prisma from '@/lib/prisma'
import { sendBookingReminder } from '@/lib/email'
import { captureErrorIfAvailable, logAuditSafe } from '@/lib/observability-helpers'
import { getBCP47Locale } from '@/lib/locale'

export interface ReminderRunResult {
  success: boolean
  processed: number
  results: Array<{ id: string; sent: boolean; reason?: string }>
  tenantStats: Record<string, { total: number; sent: number; failed: number }>
  durationMs: number
  effectiveGlobal: number
  effectiveTenant: number
  errorRate: number
}

/**
 * Runs booking reminder processing for the upcoming 24h window.
 * Extracted from api/cron/reminders route for reuse by Netlify function.
 */
export async function processBookingReminders(): Promise<ReminderRunResult> {
  const now = new Date()

  // Attempt to use scheduled reminders first
  let upcoming: any[] = []
  try {
    const scheduled = await prisma.scheduledReminder.findMany({
      where: { scheduledAt: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }, sent: false },
      include: { serviceRequest: { include: { client: { select: { id: true, name: true, email: true } }, service: { select: { name: true } } } } },
      take: 500,
    }).catch(() => [])

    if (Array.isArray(scheduled) && scheduled.length > 0) {
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
  } catch {
    upcoming = []
  }

  if (!upcoming.length) {
    upcoming = await prisma.serviceRequest.findMany({
      where: { isBooking: true, confirmed: true, reminderSent: false, scheduledAt: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } },
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

  const byTenant = new Map<string, any[]>()
  for (const appt of upcoming) {
    const key = String(appt.tenantId || 'default')
    if (!byTenant.has(key)) byTenant.set(key, [])
    byTenant.get(key)!.push(appt)
  }

  const totalAppts = upcoming.length
  const perTenantCounts: Record<string, number> = {}
  for (const [k, v] of byTenant.entries()) perTenantCounts[k] = v.length

  // Recent failure rate (best-effort)
  let perTenantFailureRate: Record<string, number> = {}
  try {
    const logs = await prisma.healthLog.findMany({ where: { service: 'AUDIT', message: { contains: 'reminders:batch_summary' } }, orderBy: { checkedAt: 'desc' }, take: 20 })
    const agg: Record<string, { processed: number; failed: number }> = {}
    for (const l of logs) {
      try {
        const parsed = JSON.parse(String(l.message))
        const stats = (parsed.details || {}).tenantStats || {}
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
  } catch {
    perTenantFailureRate = {}
  }

  const backoffThreshold = Number(process.env.REMINDERS_BACKOFF_THRESHOLD || 0.10)
  const minShare = Number(process.env.REMINDERS_MIN_SHARE || 0.1)
  const tenantAllowed: Record<string, number> = {}

  for (const [k, arr] of byTenant.entries()) {
    const fr = perTenantFailureRate[k] ?? 0
    let factor = 1
    if (fr > backoffThreshold) factor = Math.max(minShare, 1 - (fr - backoffThreshold) * 2)
    tenantAllowed[k] = Math.max(1, Math.ceil(arr.length * factor))
  }

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
    if (orderedAppts.length > totalAppts) break
  }

  const deferred: Record<string, number> = {}
  for (const k of tenantKeys) {
    const arr = byTenant.get(k) || []
    deferred[k] = Math.max(0, arr.length - (tenantAllowed[k] || 0))
  }

  const tenantStats: Record<string, { total: number; sent: number; failed: number }> = {}
  for (const k of tenantKeys) tenantStats[k] = { total: perTenantCounts[k] || 0, sent: 0, failed: 0 }

  const defaultGlobal = Number(process.env.REMINDERS_GLOBAL_CONCURRENCY || 10)
  const defaultTenant = Number(process.env.REMINDERS_TENANT_CONCURRENCY || 3)
  const maxGlobal = Number(process.env.REMINDERS_GLOBAL_CONCURRENCY_MAX || 50)
  const minGlobal = Number(process.env.REMINDERS_GLOBAL_CONCURRENCY_MIN || 2)

  let errorRate = 0
  try {
    const logs = await prisma.healthLog.findMany({ where: { service: 'AUDIT', message: { contains: 'reminders:batch_summary' } }, orderBy: { checkedAt: 'desc' }, take: 10 })
    let processedSum = 0
    let failedSum = 0
    for (const l of logs) {
      try {
        const parsed = JSON.parse(String(l.message))
        const details = parsed.details || {}
        const stats = details.tenantStats || {}
        const localProcessed = Number(details.processed || 0)
        let localFailed = 0
        for (const t in stats) localFailed += Number((stats[t].failed) || 0)
        processedSum += localProcessed
        failedSum += localFailed
      } catch {}
    }
    if (processedSum > 0) errorRate = failedSum / processedSum
  } catch {
    errorRate = 0
  }

  let effectiveGlobal = defaultGlobal
  if (errorRate > 0.10) effectiveGlobal = Math.max(minGlobal, Math.floor(defaultGlobal * 0.5))
  else if (errorRate > 0.05) effectiveGlobal = Math.max(minGlobal, Math.floor(defaultGlobal * 0.75))
  else if (errorRate < 0.02) effectiveGlobal = Math.min(maxGlobal, defaultGlobal + 2)

  const tenantTimezoneCache = new Map<string, string | null>()
  async function getTenantDefaultTimezone(tenantKey: string) {
    if (tenantTimezoneCache.has(tenantKey)) return tenantTimezoneCache.get(tenantKey) ?? undefined
    try {
      if (!tenantKey || tenantKey === 'default') {
        tenantTimezoneCache.set(tenantKey, null)
        return undefined
      }
      const row = await prisma.organizationSettings.findFirst({ where: { tenantId: tenantKey }, select: { defaultTimezone: true } }).catch(() => null)
      const tz = row?.defaultTimezone ?? null
      tenantTimezoneCache.set(tenantKey, tz)
      return tz ?? undefined
    } catch {
      tenantTimezoneCache.set(tenantKey, null)
      return undefined
    }
  }

  const results: Array<{ id: string; sent: boolean; reason?: string }> = []
  const startTs = Date.now()

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
      const tenantTz = await getTenantDefaultTimezone(tenantKey)
      const tzForDelivery = prefs?.timeZone || tenantTz || undefined
      const userLanguage = prefs?.preferredLanguage || 'en'
      const bcp47Locale = getBCP47Locale(userLanguage)
      await sendBookingReminder({ id: appt.id, scheduledAt, clientName: appt.client.name || appt.client.email || 'Client', clientEmail: appt.client.email || '', service: { name: appt.service.name } }, { locale: bcp47Locale, timeZone: tzForDelivery })
      try {
        const smsUrl = process.env.SMS_WEBHOOK_URL
        const smsAuth = process.env.SMS_WEBHOOK_AUTH
        const wantsSms = prefs?.smsReminder === true
        if (smsUrl && wantsSms && appt.clientPhone) {
          const locale = bcp47Locale
          const tzOpt = tzForDelivery ? { timeZone: tzForDelivery } as const : undefined
          const formattedDate = new Date(scheduledAt).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', ...(tzOpt || {}) } as any)
          const formattedTime = new Date(scheduledAt).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true, ...(tzOpt || {}) } as any)
          const message = `Reminder: ${appt.service.name} on ${formattedDate} at ${formattedTime}`
          await fetch(smsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(smsAuth ? { Authorization: smsAuth } : {}) }, body: JSON.stringify({ to: appt.clientPhone, message, metadata: { serviceRequestId: appt.id, tenantId: appt.tenantId, type: 'booking-reminder' } }) })
        }
      } catch (e) { await captureErrorIfAvailable(e, { route: 'cron:reminders:sms', id: appt.id }) }
      if ((appt as any).scheduledReminderId) {
        try { await prisma.scheduledReminder.update({ where: { id: (appt as any).scheduledReminderId }, data: { sent: true } }) } catch {}
        try {
          const remaining = await prisma.scheduledReminder.count({ where: { serviceRequestId: appt.id, sent: false } }).catch(() => 0)
          if (remaining === 0) { try { await prisma.serviceRequest.update({ where: { id: appt.id }, data: { reminderSent: true } }) } catch {} }
        } catch {}
      } else {
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

  for (let i = 0; i < orderedAppts.length; i += effectiveGlobal) {
    const batch = orderedAppts.slice(i, i + effectiveGlobal)
    await Promise.all(batch.map((it) => processAppointmentItem(it)))
  }

  const durationMs = Date.now() - startTs
  try { await logAuditSafe({ action: 'reminders:batch_summary', details: { totalAppts, perTenantCounts, tenantStats, processed: results.length, durationMs, effectiveGlobal, effectiveTenant: defaultTenant, errorRate } }) } catch {}

  return { success: true, processed: results.length, results, tenantStats, durationMs, effectiveGlobal, effectiveTenant: defaultTenant, errorRate }
}
