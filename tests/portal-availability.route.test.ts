import { vi, describe, it, expect } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'client1', role: 'CLIENT' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findUnique: vi.fn(async () => { const e: any = new Error('Database is not configured'); e.code = 'P1001'; throw e }),
    },
    booking: {
      findMany: vi.fn(async () => { const e: any = new Error('Database is not configured'); e.code = 'P1001'; throw e }),
    },
  },
}))

describe('api/portal/service-requests/availability route (fallback)', () => {
  it('returns fallback available slots when DB is unavailable', async () => {
    const { GET }: any = await import('@/app/api/portal/service-requests/availability/route')

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
    expect(slots.length).toBeGreaterThan(0)
    // In fallback, all slots should be available
    expect(slots.every(s => s.available)).toBe(true)
  })
})
