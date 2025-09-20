import { describe, it, expect } from 'vitest'
import { generateAvailability, addMinutes, rangesOverlap, type BusyInterval, type AvailabilityOptions } from '@/lib/booking/availability'

function d(iso: string) { return new Date(iso) }

describe('AvailabilityEngine - generateAvailability', () => {
  it('generates slots within business hours and skips weekends by default', () => {
    const from = d('2025-01-06T00:00:00.000Z') // Monday
    const to = d('2025-01-12T23:59:59.999Z')   // Sunday
    const busy: BusyInterval[] = []
    const options: AvailabilityOptions = { now: d('2025-01-06T00:00:00.000Z') }

    const slots = generateAvailability(from, to, 60, busy, options)
    // Ensure no slot falls on Saturday (6) or Sunday (0)
    expect(slots.length).toBeGreaterThan(0)
    const weekend = slots.some(s => [0,6].includes(new Date(s.start).getDay()))
    expect(weekend).toBe(false)

    // Ensure slots are between 09:00 and 17:00 local for weekdays
    const allInHours = slots.every(s => {
      const st = new Date(s.start)
      const en = new Date(s.end)
      return st.getHours() >= 9 && en.getHours() <= 17
    })
    expect(allInHours).toBe(true)
  })

  it('excludes slots that overlap with busy intervals (no buffer)', () => {
    const day = '2025-01-07' // Tuesday
    const from = d(`${day}T00:00:00.000Z`)
    const to = d(`${day}T23:59:59.999Z`)

    const busyStart = d(`${day}T10:00:00.000Z`)
    const busyEnd = addMinutes(busyStart, 60)
    const busy: BusyInterval[] = [{ start: busyStart, end: busyEnd }]

    const slots = generateAvailability(from, to, 60, busy, { now: d(`${day}T00:00:00.000Z`) })
    // No AVAILABLE slot should overlap 10-11
    const overlapExists = slots.filter(s => s.available).some(s => {
      const st = new Date(s.start)
      const en = new Date(s.end)
      return rangesOverlap(st, en, busyStart, busyEnd)
    })
    expect(overlapExists).toBe(false)
  })

  it('applies booking buffer minutes around busy intervals', () => {
    const day = '2025-01-08' // Wednesday
    const from = d(`${day}T00:00:00.000Z`)
    const to = d(`${day}T23:59:59.999Z`)

    const busyStart = d(`${day}T13:00:00.000Z`)
    const busyEnd = addMinutes(busyStart, 60)
    const busy: BusyInterval[] = [{ start: busyStart, end: busyEnd }]

    const slots = generateAvailability(from, to, 60, busy, { bookingBufferMinutes: 30, now: d(`${day}T00:00:00.000Z`) })

    // With 30min buffer, slots 12:30-13:30 and 13:30-14:30 should be excluded
    const has1230 = slots.some(s => s.start.endsWith('T12:30:00.000Z'))
    const has1330 = slots.some(s => s.start.endsWith('T13:30:00.000Z'))
    expect(has1230).toBe(false)
    expect(has1330).toBe(false)
  })

  it('enforces maxDailyBookings cap by skipping fully subscribed days', () => {
    const day = '2025-01-09' // Thursday
    const from = d(`${day}T00:00:00.000Z`)
    const to = d(`${day}T23:59:59.999Z`)

    // Two busy bookings in the day
    const busy: BusyInterval[] = [
      { start: d(`${day}T09:00:00.000Z`), end: d(`${day}T10:00:00.000Z`) },
      { start: d(`${day}T11:00:00.000Z`), end: d(`${day}T12:00:00.000Z`) },
    ]

    const slotsNoCap = generateAvailability(from, to, 60, busy, { now: d('2025-01-09T00:00:00.000Z') })
    expect(slotsNoCap.length).toBeGreaterThan(0)

    const slotsCapped = generateAvailability(from, to, 60, busy, { maxDailyBookings: 2, now: d('2025-01-09T00:00:00.000Z') })
    expect(slotsCapped.length).toBe(0)
  })
})
