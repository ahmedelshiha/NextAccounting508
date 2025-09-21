export const runtime = 'nodejs'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond, zodDetails } from '@/lib/api-response'
import { z } from 'zod'
import { getTenantFromRequest, isMultiTenancyEnabled } from '@/lib/tenant'
import { planRecurringBookings, generateOccurrences } from '@/lib/booking/recurring'

const PreviewSchema = z.object({
  serviceId: z.string().min(1),
  start: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  teamMemberId: z.string().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['DAILY','WEEKLY','MONTHLY']),
    interval: z.number().int().positive().optional(),
    count: z.number().int().positive().optional(),
    until: z.string().datetime().optional(),
    byWeekday: z.array(z.number().int().min(0).max(6)).optional(),
  })
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return respond.unauthorized()
  }

  const tenantId = getTenantFromRequest(request as any)
  const body = await request.json().catch(() => null)
  const parsed = PreviewSchema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', zodDetails(parsed.error))

  const { serviceId, start, duration, teamMemberId, recurringPattern } = parsed.data

  try {
    // Try DB-backed planning first (conflict-aware)
    const plan = await planRecurringBookings({
      serviceId,
      clientId: (session.user as any).id,
      durationMinutes: Number(duration ?? 60),
      start: new Date(start),
      pattern: {
        frequency: recurringPattern.frequency,
        interval: recurringPattern.interval,
        count: recurringPattern.count,
        until: recurringPattern.until ? new Date(recurringPattern.until) : undefined,
        byWeekday: recurringPattern.byWeekday,
      },
      tenantId: (isMultiTenancyEnabled() && tenantId) ? String(tenantId) : null,
      teamMemberId: teamMemberId || null,
    })
    const created = plan.plan.filter(p => !p.conflict).length
    const skipped = plan.plan.length - created
    return respond.ok({ plan: plan.plan, summary: { total: plan.plan.length, created, skipped } })
  } catch (e: any) {
    // Fallback: generate naive plan without conflicts when DB unavailable
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
}
