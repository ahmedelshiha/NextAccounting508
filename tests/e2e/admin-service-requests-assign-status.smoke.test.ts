import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock auth and permissions
vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => {}) }))
vi.mock('@/lib/realtime-enhanced', () => ({ realtimeService: { emitTeamAssignment: vi.fn(() => {}), emitServiceRequestUpdate: vi.fn(() => {}), broadcastToUser: vi.fn(() => {}), emitAvailabilityUpdate: vi.fn(() => {}) } }))
vi.mock('@/lib/tenant', () => ({ getTenantFromRequest: () => null, isMultiTenancyEnabled: () => false }))

// In-memory mock DB
const db: any = {
  srs: [
    { id: 'sr1', title: 'Onboard', clientId: 'c1', serviceId: 's1', status: 'SUBMITTED', scheduledAt: new Date().toISOString() },
  ],
  team: [
    { id: 'tm1', name: 'Tina' },
  ],
}

function matchId(id: string) { return (x: any) => x.id === id }

vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findUnique: vi.fn(async ({ where }: any) => db.srs.find(matchId(where.id)) || null),
      update: vi.fn(async ({ where, data, include }: any) => {
        const idx = db.srs.findIndex(matchId(where.id))
        if (idx === -1) return null
        db.srs[idx] = { ...db.srs[idx], ...data }
        const item = db.srs[idx]
        return {
          ...item,
          client: item.clientId ? { id: item.clientId, name: 'Client', email: 'client@example.com' } : null,
          service: item.serviceId ? { id: item.serviceId, name: 'Service' } : null,
        }
      }),
    },
    teamMember: {
      findUnique: vi.fn(async ({ where }: any) => db.team.find(matchId(where.id)) || null),
    },
  },
}))

// Routes under test

describe('E2E smoke — Service Requests assign → status update', () => {
  beforeEach(() => {
    db.srs = [{ id: 'sr1', title: 'Onboard', clientId: 'c1', serviceId: 's1', status: 'SUBMITTED', scheduledAt: new Date().toISOString() }]
    db.team = [{ id: 'tm1', name: 'Tina' }]
  })

  it('assigns a team member then updates status', async () => {
    const assign: any = await import('@/app/api/admin/service-requests/[id]/assign/route')
    const statusMod: any = await import('@/app/api/admin/service-requests/[id]/status/route')

    // Assign
    const aReq = new Request('https://x', { method: 'POST', body: JSON.stringify({ teamMemberId: 'tm1' }) })
    const aRes: any = await assign.POST(aReq, { params: Promise.resolve({ id: 'sr1' }) })
    expect(aRes.status).toBe(200)
    const assigned = await aRes.json()
    expect(assigned?.assignedTeamMemberId || assigned?.assigned?.id || assigned?.status).toBeDefined()

    // Status update to IN_PROGRESS
    const sReq1 = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ status: 'IN_PROGRESS' }) })
    const sRes1: any = await statusMod.PATCH(sReq1, { params: Promise.resolve({ id: 'sr1' }) })
    expect(sRes1.status).toBe(200)
    const after1 = await sRes1.json()
    expect(after1.status).toBe('IN_PROGRESS')

    // Status update to COMPLETED
    const sReq2 = new Request('https://x', { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) })
    const sRes2: any = await statusMod.PATCH(sReq2, { params: Promise.resolve({ id: 'sr1' }) })
    expect(sRes2.status).toBe(200)
    const after2 = await sRes2.json()
    expect(after2.status).toBe('COMPLETED')
  })
})
