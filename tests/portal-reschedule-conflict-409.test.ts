import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'client1' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))

const prismaMock: any = {
  serviceRequest: {
    findUnique: vi.fn(async ({ where }: any) => (where.id === 'sr1' ? { id: 'sr1', clientId: 'client1' } : null)),
  },
  booking: {
    findFirst: vi.fn(async ({ where }: any) => (where.serviceRequestId === 'sr1' ? { id: 'b1', serviceRequestId: 'sr1', serviceId: 's1', duration: 60, scheduledAt: new Date(), assignedTeamMemberId: null } : null)),
    findMany: vi.fn(async () => ([{ id: 'b2', scheduledAt: new Date(), duration: 60 }])),
    update: vi.fn(async ({ where, data }: any) => ({ id: where.id, ...data })),
  },
  service: {
    findUnique: vi.fn(async () => ({ id: 's1', active: true, bookingEnabled: true, bufferTime: 0, maxDailyBookings: null })),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

// silence email sending
vi.mock('@/lib/email', () => ({ sendBookingConfirmation: vi.fn(async () => {}) }))

describe('portal reschedule conflict handling', () => {
  beforeEach(() => {
    prismaMock.booking.findMany.mockClear()
  })

  it('returns 409 when conflict is detected', async () => {
    const mod: any = await import('@/app/api/portal/service-requests/[id]/reschedule/route')
    const when = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const req = new Request('https://x', { method: 'POST', body: JSON.stringify({ scheduledAt: when }) })
    const res: any = await mod.POST(req as any, { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('CONFLICT')
  })
})
