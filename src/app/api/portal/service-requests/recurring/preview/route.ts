export const runtime = 'nodejs'

import { respond, zodDetails } from '@/lib/api-response'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { planRecurringBookings, generateOccurrences } from '@/lib/booking/recurring'

const PreviewSchema = z.object({
  serviceId: z.string().min(1),
  start: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['DAILY','WEEKLY','MONTHLY']),
    interval: z.number().int().positive().optional(),
    count: z.number().int().positive().optional(),
    until: z.string().datetime().optional(),
    byWeekday: z.array(z.number().int().min(0).max(6)).optional(),
  })
})

export const POST = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()

  const body = await request.json().catch(() => null)
  const parsed = PreviewSchema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', zodDetails(parsed.error))

  const { serviceId, start, duration, recurringPattern } = parsed.data

  try {
    const plan = await planRecurringBookings({
      serviceId,
      clientId: String(ctx.userId),
      durationMinutes: Number(duration ?? 60),
      start: new Date(start),
      pattern: {
        frequency: recurringPattern.frequency,
        interval: recurringPattern.interval,
        count: recurringPattern.count,
        until: recurringPattern.until ? new Date(recurringPattern.until) : undefined,
        byWeekday: recurringPattern.byWeekday,
      },
      tenantId: ctx.tenantId,
      teamMemberId: null,
    })
    const created = plan.plan.filter(p => !p.conflict).length
    const skipped = plan.plan.length - created
    return respond.ok({ plan: plan.plan, summary: { total: plan.plan.length, created, skipped } })
  } catch (e: any) {
    try {
      const starts = generateOccurrences(new Date(start), Number(duration ?? 60), {
        frequency: recurringPattern.frequency,
        interval: recurringPattern.interval,
        count: recurringPattern.count,
        until: recurringPattern.until ? new Date(recurringPattern.until) : undefined,
        byWeekday: recurringPattern.byWeekday,
      })
      const plan = starts.map((s) => ({ start: s, end: new Date(s.getTime() + Number(duration ?? 60) * 60000), conflict: false }))
      return respond.ok({ plan, summary: { total: plan.length, created: plan.length, skipped: 0 }, fallback: true })
    } catch {
      return respond.serverError()
    }
  }
})
