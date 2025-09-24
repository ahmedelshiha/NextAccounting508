import { describe, it, expect, beforeEach, vi } from 'vitest'

function mockSession(role: 'CLIENT'|'ADMIN'|'STAFF' = 'CLIENT', id = 'client1') {
  vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id, role } })) }))
  vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id, role } })) }))
  vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
}

function mockTenant(tenantId: string | null) {
  vi.doMock('@/lib/tenant', () => ({
    getTenantFromRequest: () => tenantId,
    isMultiTenancyEnabled: () => !!tenantId,
  }))
}

const prismaMock: any = {
  booking: {
    findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, clientId: 'client1', status: 'CONFIRMED', tenantId: 't1' })),
    update: vi.fn(async ({ where, data }: any) => ({ id: where.id, status: data.status })),
  },
}

function mockPrisma() {
  vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
}

function makeReq(id = 'b1') {
  const url = `https://app.example.com/api/bookings/${id}`
  return new Request(url, { method: 'DELETE' })
}

describe('Portal booking cancel flow', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    prismaMock.booking.findUnique.mockClear()
    prismaMock.booking.update.mockClear()
  })

  it('CLIENT owner can cancel own booking (status set to CANCELLED)', async () => {
    mockSession('CLIENT', 'client1')
    mockTenant('t1')
    mockPrisma()

    const mod = await import('@/app/api/bookings/[id]/route')
    const res: any = await mod.DELETE(makeReq('b-ok') as any, { params: Promise.resolve({ id: 'b-ok' }) } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toMatch(/cancelled/i)
    expect(prismaMock.booking.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'CANCELLED' } }))
  })

  it('returns 404 on tenant mismatch when multi-tenancy enabled', async () => {
    mockSession('CLIENT', 'client1')
    mockTenant('other-tenant')
    mockPrisma()

    const mod = await import('@/app/api/bookings/[id]/route')
    const res: any = await mod.DELETE(makeReq('b-tenant-mismatch') as any, { params: Promise.resolve({ id: 'b-tenant-mismatch' }) } as any)
    expect(res.status).toBe(404)
  })

  it('returns 403 when non-owner and not admin/staff', async () => {
    mockSession('CLIENT', 'client-2')
    mockTenant('t1')
    // booking belongs to client1
    prismaMock.booking.findUnique.mockResolvedValueOnce({ id: 'b1', clientId: 'client1', status: 'CONFIRMED', tenantId: 't1' })
    mockPrisma()

    const mod = await import('@/app/api/bookings/[id]/route')
    const res: any = await mod.DELETE(makeReq('b1') as any, { params: Promise.resolve({ id: 'b1' }) } as any)
    expect(res.status).toBe(403)
  })
})
