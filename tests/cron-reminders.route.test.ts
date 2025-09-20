import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const env = process.env

vi.mock('@/lib/email', () => ({ sendBookingReminder: vi.fn(async () => {}) }))
vi.mock('@/lib/observability-helpers', () => ({ captureErrorIfAvailable: vi.fn(async () => {}), logAuditSafe: vi.fn(async () => {}) }))

const db: any = {
  upcoming: [] as any[],
  prefs: new Map<string, any>(),
  updates: [] as any[],
}

vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findMany: vi.fn(async () => db.upcoming),
      update: vi.fn(async ({ where, data }: any) => { db.updates.push({ where, data }); return { id: where.id, ...data } }),
    },
    bookingPreferences: {
      findUnique: vi.fn(async ({ where }: any) => db.prefs.get(where.userId) || null),
    },
  },
}))

describe('api/cron/reminders route', () => {
  beforeEach(() => {
    db.upcoming = []
    db.prefs.clear()
    db.updates = []
    process.env = { ...env } as any
  })
  afterEach(() => { process.env = env })

  it('rejects when secret mismatch', async () => {
    process.env.CRON_SECRET = 's3cr3t'
    const { POST }: any = await import('@/app/api/cron/reminders/route')
    const res: any = await POST(new Request('https://x', { method: 'POST', headers: { 'x-cron-secret': 'nope' } }))
    expect(res.status).toBe(401)
  })

  it('skips when DB not configured', async () => {
    delete process.env.DATABASE_URL
    delete process.env.NETLIFY_DATABASE_URL
    const { POST }: any = await import('@/app/api/cron/reminders/route')
    const res: any = await POST(new Request('https://x', { method: 'POST' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.processed).toBe(0)
  })

  it('sends reminder within window and marks reminderSent', async () => {
    process.env.DATABASE_URL = 'postgres://test'
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    db.upcoming = [{ id: 'sr1', scheduledAt: in24h, client: { id: 'u1', name: 'Client', email: 'c@example.com' }, service: { name: 'Consulting' } }]
    // No prefs -> defaults [24,2]
    const { POST }: any = await import('@/app/api/cron/reminders/route')
    const res: any = await POST(new Request('https://x', { method: 'POST' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(db.updates.some(u => u.where.id === 'sr1' && u.data.reminderSent === true)).toBe(true)
    const { sendBookingReminder }: any = await import('@/lib/email')
    expect(sendBookingReminder).toHaveBeenCalledTimes(1)
  })
})
