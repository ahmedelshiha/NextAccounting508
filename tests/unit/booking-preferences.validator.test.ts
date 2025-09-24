import { describe, it, expect } from 'vitest'
import { UpdateSchema } from '@/app/api/portal/settings/booking-preferences/route'

describe('Booking preferences Zod schema', () => {
  it('accepts valid payload', () => {
    const payload = {
      emailConfirmation: true,
      smsReminder: false,
      reminderHours: [24,2],
      timeZone: 'UTC',
      preferredLanguage: 'en'
    }
    const res = UpdateSchema.safeParse(payload)
    expect(res.success).toBe(true)
  })

  it('rejects invalid reminderHours (too many)', () => {
    const payload = { reminderHours: [1,2,3,4,5,6,7,8,9] }
    const res = UpdateSchema.safeParse(payload)
    expect(res.success).toBe(false)
  })

  it('rejects invalid reminderHours values (<1)', () => {
    const payload = { reminderHours: [0, 24] }
    const res = UpdateSchema.safeParse(payload)
    expect(res.success).toBe(false)
  })

  it('rejects invalid preferredLanguage (too short)', () => {
    const payload = { preferredLanguage: 'e' }
    const res = UpdateSchema.safeParse(payload)
    expect(res.success).toBe(false)
  })

  it('allows partial updates (optional fields)', () => {
    const payload = { smsReminder: true }
    const res = UpdateSchema.safeParse(payload)
    expect(res.success).toBe(true)
  })
})
