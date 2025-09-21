import { describe, it, expect } from 'vitest'
import { generateAvailability, addMinutes } from '@/lib/booking/availability'

function mkDate(y: number, m: number, d: number, h = 9, min = 0) {
  return new Date(Date.UTC(y, m - 1, d, h, min, 0, 0))
}

describe('generateAvailability', () => {
  it('respects business hours and slot duration', () => {
    const from = mkDate(2025, 1, 6, 9) // Mon
    const to = mkDate(2025, 1, 6, 17)
    const busy: { start: Date; end: Date }[] = []
    const slots = generateAvailability(from, to, 60, busy, {
      businessHours: { 1: { startMinutes: 9 * 60, endMinutes: 17 * 60 } },
      skipWeekends: true,
      now: mkDate(2025, 1, 6, 8),
    })
    // 9-10, 10-11, 11-12, 12-13, 13-14, 14-15, 15-16, 16-17 => 8 slots
    expect(slots.length).toBe(8)
    expect(slots.every(s => s.available)).toBe(true)
  })

  it('skips weekends when configured', () => {
    const sat = mkDate(2025, 1, 4, 9) // Saturday
    const sun = mkDate(2025, 1, 5, 9) // Sunday
    const mon = mkDate(2025, 1, 6, 9) // Monday
    const busy: { start: Date; end: Date }[] = []
    const slots = generateAvailability(sat, mon, 60, busy, {
      businessHours: { 0: { startMinutes: 9 * 60, endMinutes: 17 * 60 }, 1: { startMinutes: 9 * 60, endMinutes: 17 * 60 }, 6: { startMinutes: 9 * 60, endMinutes: 17 * 60 } },
      skipWeekends: true,
      now: mkDate(2025, 1, 4, 8),
    })
    // Should only include Monday if weekends skipped
    const days = new Set(slots.map(s => new Date(s.start).getUTCDay()))
    expect(days.has(1)).toBe(true)
    expect(days.has(0)).toBe(false)
    expect(days.has(6)).toBe(false)
  })

  it('applies buffer around busy intervals', () => {
    const from = mkDate(2025, 1, 6, 9)
    const to = mkDate(2025, 1, 6, 17)
    const busyStart = mkDate(2025, 1, 6, 11)
    const busyEnd = addMinutes(busyStart, 60)
    const busy = [{ start: busyStart, end: busyEnd }]

    const slots = generateAvailability(from, to, 60, busy, {
      businessHours: { 1: { startMinutes: 9 * 60, endMinutes: 17 * 60 } },
      bookingBufferMinutes: 30,
      now: mkDate(2025, 1, 6, 8),
    })

    const label = (d: Date) => `${d.getUTCHours()}:00`
    const withLabels = slots.map(s => ({ start: label(new Date(s.start)), available: s.available }))
    // 10-11 should be available, 11-12 and 12-13 blocked due to 30m buffer around 11-12 busy
    const at10 = withLabels.find(s => s.start === '10:00')
    const at11 = withLabels.find(s => s.start === '11:00')
    const at12 = withLabels.find(s => s.start === '12:00')
    expect(at10?.available).toBe(true)
    expect(at11?.available).toBe(false)
    expect(at12?.available).toBe(false)
  })

  it('enforces max daily bookings by skipping days at capacity', () => {
    const from = mkDate(2025, 1, 6, 9)
    const to = mkDate(2025, 1, 6, 17)
    // 2 existing busy intervals -> if maxDailyBookings = 2, day should be skipped entirely
    const busy = [
      { start: mkDate(2025, 1, 6, 9), end: mkDate(2025, 1, 6, 10) },
      { start: mkDate(2025, 1, 6, 10), end: mkDate(2025, 1, 6, 11) },
    ]
    const slots = generateAvailability(from, to, 60, busy, {
      businessHours: { 1: { startMinutes: 9 * 60, endMinutes: 17 * 60 } },
      maxDailyBookings: 2,
      now: mkDate(2025, 1, 6, 8),
    })
    expect(slots.length).toBe(0)
  })
})
