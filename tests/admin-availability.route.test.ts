import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const db: any = {
  service: { id: 'svc1', active: true, duration: 60 },
  bookings: [] as { scheduledAt: string; duration?: number }[],
}

vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findUnique: vi.fn(async ({ where }: any) => (where.id === 'svc1' ? db.service : null)),
    },
    booking: {
      findMany: vi.fn(async () => db.bookings),
    },
  },
}))

describe('api/admin/service-requests/availability route', () => {
  beforeEach(() => {
    db.bookings = []
  })

  it('returns available slots excluding conflicts', async () => {
    const { GET }: any = await import('@/app/api/admin/service-requests/availability/route')
    // Busy slot 10:00-11:00Z
    db.bookings = [{ scheduledAt: '2025-01-01T10:00:00.000Z', duration: 60 }]

    const url = new URL('https://x')
    url.searchParams.set('serviceId', 'svc1')
    url.searchParams.set('dateFrom', '2025-01-01T00:00:00.000Z')
    url.searchParams.set('dateTo', '2025-01-01T23:59:59.000Z')

    const res: any = await GET({ url: url.toString() } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    const slots = json.data.slots as { start: string; end: string; available: boolean }[]
    expect(Array.isArray(slots)).toBe(true)
    // should include 09:00-10:00 available
    const nine = slots.find(s => s.start === '2025-01-01T09:00:00.000Z')
    expect(nine).toBeTruthy()
    expect(nine!.available).toBe(true)
    // 10:00-11:00 should be unavailable due to conflict
    const ten = slots.find(s => s.start === '2025-01-01T10:00:00.000Z')
    expect(ten).toBeTruthy()
    expect(ten!.available).toBe(false)
  })
})
