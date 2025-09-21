import { checkBookingConflict } from './conflict-detection'
import { addMinutes } from './availability'

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export type RecurringPattern = {
  frequency: RecurrenceFrequency
  interval?: number
  count?: number
  until?: Date
  byWeekday?: number[]
}

export type RecurringPlanItem = {
  start: Date
  end: Date
  conflict: boolean
  reason?: string
}

export function generateOccurrences(start: Date, durationMinutes: number, pattern: RecurringPattern): Date[] {
  const out: Date[] = []
  const interval = Math.max(1, pattern.interval ?? 1)
  const maxCount = pattern.count ?? 0
  const until = pattern.until ? new Date(pattern.until) : null

  let current = new Date(start)
  let occurrences = 0

  while (true) {
    if (until && current > until) break
    if (maxCount && occurrences >= maxCount) break

    if (!pattern.byWeekday || pattern.byWeekday.includes(current.getDay())) {
      out.push(new Date(current))
      occurrences++
    }

    if (pattern.frequency === 'DAILY') {
      current.setDate(current.getDate() + interval)
    } else if (pattern.frequency === 'WEEKLY') {
      current.setDate(current.getDate() + 7 * interval)
    } else {
      const m = current.getMonth()
      current.setMonth(m + interval)
    }
  }

  return out
}

export async function planRecurringBookings(params: {
  serviceId: string
  clientId: string
  durationMinutes: number
  start: Date
  pattern: RecurringPattern
  tenantId?: string | null
  teamMemberId?: string | null
}) {
  const { serviceId, durationMinutes, start, pattern, tenantId, teamMemberId } = params
  const starts = generateOccurrences(start, durationMinutes, pattern)

  const plan: RecurringPlanItem[] = []
  for (const s of starts) {
    const { conflict, details } = await checkBookingConflict({
      serviceId,
      start: s,
      durationMinutes,
      excludeBookingId: undefined,
      tenantId: tenantId || null,
      teamMemberId: teamMemberId || null,
    })
    plan.push({ start: s, end: addMinutes(s, durationMinutes), conflict, reason: details?.reason })
  }

  return { plan }
}
