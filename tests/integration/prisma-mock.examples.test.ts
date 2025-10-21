import { expect, it, describe, beforeEach } from 'vitest'

const { setModelMethod, resetPrismaMock } = require('../../__mocks__/prisma')

function mockSessionClient(id = 'client1') {
  vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id } })) }))
  vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
}

describe('Prisma mock examples', () => {
  beforeEach(() => {
    vi.resetModules()
    resetPrismaMock()
  })

  it('example: override serviceRequest.findMany for export route', async () => {
    mockSessionClient('client1')

    const items = [
      { id: 'sr-x', title: 'Example Item', priority: 'MEDIUM', status: 'SUBMITTED', createdAt: new Date('2024-01-01T00:00:00Z'), scheduledAt: null, bookingType: '', service: { name: 'Example' }, clientId: 'client1', tenantId: 'test-tenant' }
    ]

    // Use setModelMethod to override the shared mock implementation for a single test
    setModelMethod('serviceRequest', 'findMany', async ({ where }: any) => items)
    vi.doMock('@/lib/prisma', () => ({ default: (globalThis as any).prismaMock }))

    const { GET }: any = await import('@/app/api/portal/service-requests/export/route')
    const url = 'https://app.example.com/api/portal/service-requests/export?status=SUBMITTED'
    const res: Response = await GET(new Request(url) as any)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toMatch(/Example Item/)
  })

  it('example: override booking.findUnique and update for cancel flow', async () => {
    // Simulate authenticated client owner
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'client1', role: 'CLIENT' } })) }))
    vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
    vi.doMock('@/lib/tenant', () => ({ getTenantFromRequest: () => 't1', isMultiTenancyEnabled: () => true }))

    // Override booking model methods
    setModelMethod('booking', 'findUnique', async ({ where }: any) => ({ id: where.id, clientId: 'client1', status: 'CONFIRMED', tenantId: 'test-tenant' }))
    setModelMethod('booking', 'update', async ({ where, data }: any) => ({ id: where.id, status: data.status }))
    vi.doMock('@/lib/prisma', () => ({ default: (globalThis as any).prismaMock }))

    const mod = await import('@/app/api/bookings/[id]/route')
    const req = new Request('https://app.example.com/api/bookings/bx', { method: 'DELETE' })
    const res: any = await mod.DELETE(req as any, { params: Promise.resolve({ id: 'bx' }) } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toMatch(/cancelled/i)
  })
})
