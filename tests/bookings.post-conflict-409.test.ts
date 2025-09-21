vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'ADMIN', name: 'Admin' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))

const prismaMock: any = {
  user: {
    findUnique: vi.fn(async ({ where }: any) => ({ id: where.id })),
  },
  service: {
    findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, name: 'Consult', active: true, bookingEnabled: true, duration: 60, bufferTime: 0, maxDailyBookings: null })),
  },
  serviceRequest: {
    create: vi.fn(async ({ data }: any) => ({ id: 'sr-new', ...data })),
  },
  booking: {
    // One existing booking to cause overlap with any new one
    findMany: vi.fn(async () => ([{ id: 'b1', scheduledAt: new Date(), duration: 60 }])),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/realtime-enhanced', () => ({ realtimeService: { emitServiceRequestUpdate: vi.fn(() => {}), broadcastToUser: vi.fn(() => {}), emitAvailabilityUpdate: vi.fn(() => {}) } }))


describe('/api/bookings POST legacy mapping — conflict passthrough', () => {
  beforeEach(() => {
    prismaMock.booking.findMany.mockClear()
  })

  it('ADMIN: returns 409 when conflict is detected via admin route', async () => {
    const { POST }: any = await import('@/app/api/bookings/route')
    const payload = {
      clientId: 'c1',
      serviceId: 'svc1',
      title: 'Legacy Booking',
      notes: 'Some notes',
      scheduledAt: new Date().toISOString(),
      duration: 60,
      assignedTeamMemberId: 'tm1',
    }
    const req = new Request('https://x/api/bookings', { method: 'POST', body: JSON.stringify(payload) })
    const res: any = await POST(req as any)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('CONFLICT')
  })

  it('PORTAL (client): returns 409 when conflict is detected via portal route', async () => {
    // Switch session to a client for this test
    const mod = await import('next-auth')
    ;(mod.getServerSession as any).mockResolvedValueOnce({ user: { id: 'client1', role: 'CLIENT', name: 'Client' } })

    const { POST }: any = await import('@/app/api/bookings/route')
    const payload = {
      serviceId: 'svc1',
      title: 'Legacy Booking',
      scheduledAt: new Date().toISOString(),
      duration: 60,
    }
    const req = new Request('https://x/api/bookings', { method: 'POST', body: JSON.stringify(payload) })
    const res: any = await POST(req as any)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('CONFLICT')
  })
})
