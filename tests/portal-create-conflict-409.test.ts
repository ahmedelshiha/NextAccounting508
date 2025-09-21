import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'client1', name: 'Client' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))

const prismaMock: any = {
  service: {
    findUnique: vi.fn(async ({ where }: any) => (where.id ? { id: where.id, name: 'Consult', active: true, bookingEnabled: true, duration: 60, bufferTime: 0, maxDailyBookings: null } : null)),
  },
  serviceRequest: {
    create: vi.fn(async ({ data }: any) => ({ id: 'sr-new', ...data })),
  },
  booking: {
    findMany: vi.fn(async () => ([{ id: 'b1', scheduledAt: new Date(), duration: 60 }])),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

// silence audit/obs
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))
vi.mock('@/lib/observability', () => ({ captureError: vi.fn(async () => {}) }))

describe('portal create booking conflict handling', () => {
  beforeEach(() => {
    prismaMock.booking.findMany.mockClear()
  })

  it('returns 409 when conflict is detected on create', async () => {
    const { POST }: any = await import('@/app/api/portal/service-requests/route')
    const payload = { serviceId: 'svc1', title: 'Need help', priority: 'LOW', isBooking: true, scheduledAt: new Date().toISOString(), duration: 60 }
    const res: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify(payload) }))
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('CONFLICT')
  })
})
