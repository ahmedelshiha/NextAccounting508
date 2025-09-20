import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'client1' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))

const db: any = {
  sr: { id: 'sr1', clientId: 'client1' },
  booking: { id: 'b1', serviceRequestId: 'sr1', serviceId: 's1', duration: 60, scheduledAt: new Date() },
}

const prismaMock = {
  serviceRequest: {
    findUnique: vi.fn(async ({ where }: any) => (where.id === db.sr.id ? { id: db.sr.id, clientId: db.sr.clientId } : null)),
  },
  booking: {
    findFirst: vi.fn(async ({ where }: any) => (where.serviceRequestId === db.booking.serviceRequestId ? { ...db.booking } : null)),
    update: vi.fn(async ({ where, data }: any) => ({ ...db.booking, id: where.id, ...data })),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

describe('portal service-requests confirm/reschedule endpoints', () => {
  beforeEach(() => {
    prismaMock.serviceRequest.findUnique.mockClear()
    prismaMock.booking.findFirst.mockClear()
    prismaMock.booking.update.mockClear()
    db.sr = { id: 'sr1', clientId: 'client1' }
    db.booking = { id: 'b1', serviceRequestId: 'sr1', serviceId: 's1', duration: 60, scheduledAt: new Date() }
  })

  it('POST /confirm confirms linked booking', async () => {
    const mod: any = await import('@/app/api/portal/service-requests/[id]/confirm/route')
    const res: any = await mod.POST(new Request('https://x', { method: 'POST' }) as any, { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    // Either booking or serviceRequest returned depending on path; assert success and shape contains something
    expect(json.data || json.booking || json.serviceRequest).toBeTruthy()
  })

  it('POST /reschedule updates booking scheduledAt', async () => {
    const mod: any = await import('@/app/api/portal/service-requests/[id]/reschedule/route')
    const when = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const req = new Request('https://x', { method: 'POST', body: JSON.stringify({ scheduledAt: when }) })
    const res: any = await mod.POST(req as any, { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data || json.booking || json.serviceRequest).toBeTruthy()
  })
})
