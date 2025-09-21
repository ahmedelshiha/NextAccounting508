import { describe, it, expect, vi } from 'vitest'
import { generateOccurrences, planRecurringBookings } from '@/lib/booking/recurring'

vi.mock('@/lib/booking/conflict-detection', async (orig) => {
  return {
    // @ts-ignore
    ...(await (orig as any)()),
    checkBookingConflict: vi.fn(async ({ start }: any) => {
      // Mark every other occurrence as conflict to validate mapping
      const minute = new Date(start).getMinutes()
      const conflict = minute % 2 === 0
      return { conflict, details: conflict ? { reason: 'OVERLAP' } : undefined }
    })
  }
})

describe('generateOccurrences', () => {
  it('creates daily occurrences up to count', () => {
    const start = new Date(Date.UTC(2025, 0, 1, 9, 1)) // Jan 1, 2025 09:01Z
    const list = generateOccurrences(start, 60, { frequency: 'DAILY', count: 3 })
    expect(list.length).toBe(3)
    expect(list[0].toISOString()).toBe(start.toISOString())
    expect(list[1].getUTCDate()).toBe(2)
    expect(list[2].getUTCDate()).toBe(3)
  })

  it('respects byWeekday for weekly pattern', () => {
    const start = new Date(Date.UTC(2025, 0, 6, 9, 3)) // Mon
    const list = generateOccurrences(start, 60, { frequency: 'WEEKLY', interval: 1, count: 4, byWeekday: [1] })
    expect(list.length).toBe(4)
    expect(list.every(d => d.getUTCDay() === 1)).toBe(true)
  })

  it('stops at until date', () => {
    const start = new Date(Date.UTC(2025, 0, 1, 9, 5))
    const until = new Date(Date.UTC(2025, 0, 10, 9))
    const list = generateOccurrences(start, 60, { frequency: 'DAILY', until })
    expect(list.length).toBeGreaterThan(0)
    expect(list[list.length - 1] <= until).toBe(true)
  })
})

describe('planRecurringBookings', () => {
  it('maps conflicts into plan items', async () => {
    const start = new Date(Date.UTC(2025, 0, 6, 9, 2))
    const plan = await planRecurringBookings({ serviceId: 'svc', clientId: 'u1', durationMinutes: 60, start, pattern: { frequency: 'DAILY', count: 3 } })
    expect(plan.plan.length).toBe(3)
    // With mocked rule: minute even => conflict
    expect(plan.plan[0].conflict).toBe(true)
    expect(plan.plan[1].conflict).toBe(false)
  })
})
