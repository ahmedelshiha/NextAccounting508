import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'client1' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))

// In-memory mock DB
const db: any = { items: [] }

vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, name: 'Svc', slug: 'svc', active: true, duration: 60 })),
    },
    serviceRequest: {
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `sr${db.items.length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...data }
        db.items.push(created)
        return created
      }),
    },
  },
}))

vi.mock('@/lib/booking/recurring', async (orig) => {
  const mod = await (orig as any)()
  return {
    ...mod,
    planRecurringBookings: vi.fn(async ({ start }: any) => {
      const s = new Date(start)
      const a = new Date(s)
      const b = new Date(s); b.setDate(b.getDate() + 7)
      const c = new Date(s); c.setDate(c.getDate() + 14)
      return {
        plan: [a, b, c].map((d) => ({ start: d, end: new Date(d.getTime() + 60*60000), conflict: false }))
      }
    }),
  }
})

function post(body: any) {
  return new Request('https://example.com/api/portal/service-requests', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  })
}

describe('portal recurring series creation', () => {
  beforeEach(() => { db.items = [] })

  it('creates a parent and children for recurring bookings', async () => {
    const { POST }: any = await import('@/app/api/portal/service-requests/route')
    const res: any = await POST(post({
      serviceId: 'svc-123',
      isBooking: true,
      scheduledAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
      duration: 60,
      bookingType: 'RECURRING',
      recurringPattern: { frequency: 'WEEKLY', interval: 1, count: 3 }
    }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.parent).toBeTruthy()
    expect(Array.isArray(json.data.childrenCreated)).toBe(true)
    expect(json.data.childrenCreated.length).toBeGreaterThan(0)
  })
})
