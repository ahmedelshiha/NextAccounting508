import { describe, it, expect } from 'vitest'
import { generateAvailability } from '@/lib/booking/availability'

// Helper to build businessHours: same hours every weekday (1..5)
const weekdayBusinessHours = {
  1: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
  2: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
  3: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
  4: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
  5: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
}

describe('generateAvailability timezone handling', () => {
  it('returns different slot counts when evaluated in different timezones (DST day)', () => {
    const from = new Date('2025-03-09T00:00:00Z')
    const to = new Date('2025-03-09T23:59:59Z')
    const slotMinutes = 60
    const busy: any[] = []

    // Evaluate with UTC timezone
    const utcSlots = generateAvailability(from, to, slotMinutes, busy, { businessHours: weekdayBusinessHours, timeZone: 'UTC', now: new Date('2025-03-09T08:00:00Z') })

    // Evaluate with America/New_York (DST transition date in many years)
    const nySlots = generateAvailability(from, to, slotMinutes, busy, { businessHours: weekdayBusinessHours, timeZone: 'America/New_York', now: new Date('2025-03-09T08:00:00Z') })

    // They should not be identical (timezone influences "now" and slot filtering)
    expect(Array.isArray(utcSlots)).toBe(true)
    expect(Array.isArray(nySlots)).toBe(true)
    expect(utcSlots.length === nySlots.length).toBe(false)
  })

  it('skips past slots relative to tenant local time', () => {
    const from = new Date('2025-03-10T00:00:00Z')
    const to = new Date('2025-03-10T23:59:59Z')
    const slotMinutes = 60
    const busy: any[] = []

    // choose a "now" such that in UTC it's early, but in Tokyo it's later in the day
    const now = new Date('2025-03-10T02:00:00Z')

    const slotsUtc = generateAvailability(from, to, slotMinutes, busy, { businessHours: weekdayBusinessHours, timeZone: 'UTC', now })
    const slotsTokyo = generateAvailability(from, to, slotMinutes, busy, { businessHours: weekdayBusinessHours, timeZone: 'Asia/Tokyo', now })

    // In Tokyo local time, now corresponds to later local time so fewer future slots are available
    expect(slotsTokyo.length).toBeLessThanOrEqual(slotsUtc.length)
  })
})
