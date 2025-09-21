import { vi, describe, it, expect, beforeEach } from 'vitest'

// default ADMIN session via vitest.setup

const prismaMock: any = {
  serviceRequest: {
    create: vi.fn(async ({ data }: any) => ({ id: 'sr-new', ...data })),
  },
  service: {
    findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, active: true, bookingEnabled: true, duration: 60, bufferTime: 0, maxDailyBookings: null })),
  },
  booking: {
    findMany: vi.fn(async () => ([{ id: 'b1', scheduledAt: new Date(), duration: 60 }])),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

// silence auto-assign and realtime
vi.mock('@/lib/service-requests/assignment', () => ({ autoAssignServiceRequest: vi.fn(async () => {}) }))
vi.mock('@/lib/realtime-enhanced', () => ({ realtimeService: { emitServiceRequestUpdate: vi.fn(() => {}) } }))


describe('admin create booking conflict handling', () => {
  beforeEach(() => {
    prismaMock.booking.findMany.mockClear()
  })

  it('returns 409 when conflict is detected on create', async () => {
    const { POST }: any = await import('@/app/api/admin/service-requests/route')
    const payload = { clientId: 'c1', serviceId: 's1', title: 'Book', priority: 'LOW', isBooking: true, scheduledAt: new Date().toISOString(), duration: 60 }
    const res: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify(payload) }))
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('CONFLICT')
  })
})
