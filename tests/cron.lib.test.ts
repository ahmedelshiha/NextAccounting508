import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const env = process.env

vi.mock('@/lib/cron/reminders', () => ({
  processBookingReminders: vi.fn(async () => ({
    success: true,
    processed: 2,
    results: [{ id: 'a', sent: true }, { id: 'b', sent: true }],
    tenantStats: { default: { total: 2, sent: 2, failed: 0 } },
    durationMs: 10,
    effectiveGlobal: 2,
    effectiveTenant: 1,
    errorRate: 0,
  }))
}))

vi.mock('@/lib/prisma', () => ({ default: {} }))

describe('src/lib/cron sendBookingReminders', () => {
  beforeEach(() => { process.env = { ...env } as any })
  afterEach(() => { process.env = env })

  it('returns aggregated stats from processBookingReminders', async () => {
    const { sendBookingReminders } = await import('@/lib/cron')
    const res = await sendBookingReminders()
    expect(res).toHaveProperty('total')
    expect(res).toHaveProperty('sent')
    expect(res).toHaveProperty('failed')
    expect(res.total).toBe(2)
    expect(res.sent).toBe(2)
    expect(res.failed).toBe(0)
  })
})
