vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => {}) }))
vi.mock('@/lib/realtime-enhanced', () => ({
  realtimeService: {
    emitServiceRequestUpdate: vi.fn(() => {}),
    broadcastToUser: vi.fn(() => {}),
  },
}))

const mockUpdate = vi.fn(async ({ where, data }: any) => ({ id: where.id, ...data, client: { id: 'c1', name: 'Client One', email: 'client@example.com' }, service: { id: 's1', name: 'Service A' } }))
vi.mock('@/lib/prisma', () => ({ default: { serviceRequest: { update: mockUpdate } } }))

import { getServerSession } from 'next-auth'

let PATCH: any
beforeAll(async () => {
  const mod = await import('@/app/api/admin/service-requests/[id]/status/route')
  PATCH = mod.PATCH
})

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Service Request status transitions & RBAC guards', () => {
  it('returns 401 when not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null)
    const req = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }) })
    const res: any = await PATCH(req as any, { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 401 when role lacks SERVICE_REQUESTS_UPDATE permission (CLIENT)', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'u1', role: 'CLIENT' } })
    const req = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }) })
    const res: any = await PATCH(req as any, { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid payload', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' } })
    const req = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ status: 'INVALID' }) })
    const res: any = await PATCH(req as any, { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status).toBe(400)
  })

  it('updates status when authorized (ADMIN)', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' } })
    const req = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }) })
    const res: any = await PATCH(req as any, { params: Promise.resolve({ id: 'sr1' }) })
    expect(res.status || 200).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveProperty('status', 'APPROVED')
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('allows TEAM_MEMBER role to update status (has permission)', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'tm1', role: 'TEAM_MEMBER' } })
    const req = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ status: 'ASSIGNED' }) })
    const res: any = await PATCH(req as any, { params: Promise.resolve({ id: 'sr2' }) })
    expect(res.status || 200).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('ASSIGNED')
  })
})
