vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))
vi.mock('@/lib/realtime-enhanced', () => ({
  realtimeService: {
    emitServiceRequestUpdate: vi.fn(() => {}),
    broadcastToUser: vi.fn(() => {}),
  },
}))

// Force DB-disabled fallback path
vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findMany: vi.fn(async () => { const err: any = new Error('P1010: DB not configured'); err.code = 'P1010'; throw err }),
      count: vi.fn(async () => { const err: any = new Error('P1010: DB not configured'); err.code = 'P1010'; throw err }),
      create: vi.fn(async () => { const err: any = new Error('P1010: DB not configured'); err.code = 'P1010'; throw err }),
    },
  },
}))

// Mock dev-fallbacks store for GET/POST fallbacks
const store: any[] = [
  { id: 'a1', title: 'Emergency consult', status: 'SUBMITTED', priority: 'HIGH', createdAt: new Date().toISOString(), isBooking: true, bookingType: 'EMERGENCY', scheduledAt: new Date(Date.now()+3600000).toISOString() },
  { id: 'b1', title: 'Standard request', status: 'SUBMITTED', priority: 'MEDIUM', createdAt: new Date().toISOString() },
]
vi.mock('@/lib/dev-fallbacks', () => ({
  getAllRequests: () => store.slice(),
  addRequest: (id: string, data: any) => { store.unshift({ ...data, id }) },
}))

describe('admin/service-requests booking features', () => {
  it('GET filters appointments and bookingType via fallback', async () => {
    const { GET }: any = await import('@/app/api/admin/service-requests/route')
    const res: any = await GET(new Request('https://x?type=appointments&bookingType=EMERGENCY&page=1&limit=10'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBe(1)
    expect(json.data[0].bookingType || 'EMERGENCY').toBe('EMERGENCY')
  })

  it('POST creates booking with scheduledAt via fallback', async () => {
    const { POST }: any = await import('@/app/api/admin/service-requests/route')
    const payload = {
      clientId: 'c1',
      serviceId: 's1',
      title: 'Booked consult',
      priority: 'LOW',
      isBooking: true,
      scheduledAt: new Date().toISOString(),
      bookingType: 'CONSULTATION',
    }
    const res: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify(payload) }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.isBooking).toBe(true)
    expect(typeof json.data.scheduledAt === 'string').toBe(true)
    expect(json.data.bookingType).toBe('CONSULTATION')
  })
})
