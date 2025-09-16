import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const originalEnv = { ...process.env }

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'ADMIN' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const db: any = {
  members: [
    { id: 'm1', name: 'A', email: 'a@example.com', isAvailable: true, specialties: ['tax'], department: 'Ops', title: 'Acct', hourlyRate: 50 },
    { id: 'm2', name: 'B', email: 'b@example.com', isAvailable: false, specialties: ['audit'], department: 'Ops', title: 'Sr Acct', hourlyRate: 70 },
  ],
  serviceRequests: [
    { id: 'sr1', assignedTeamMemberId: 'm1', status: 'ASSIGNED', priority: 'HIGH' },
    { id: 'sr2', assignedTeamMemberId: 'm1', status: 'IN_PROGRESS', priority: 'LOW' },
  ],
}

vi.mock('@/lib/prisma', () => ({
  default: {
    teamMember: {
      findMany: vi.fn(async ({ select }: any) => db.members.map((m: any) => Object.fromEntries(Object.keys(select).map(k => [k, (m as any)[k]])))),
      update: vi.fn(async ({ where, data }: any) => {
        const m = db.members.find((x: any) => x.id === where.id)
        if (!m) throw new Error('not found')
        m.specialties = data.specialties
        return { id: m.id, specialties: m.specialties }
      }),
    },
    serviceRequest: {
      groupBy: vi.fn(async ({ by, where, _count }: any) => {
        const filtered = db.serviceRequests.filter((r: any) => !where || where.status?.in?.includes(r.status))
        const map: Record<string, any> = {}
        for (const r of filtered) {
          const key = String(r.assignedTeamMemberId)
          map[key] ||= { assignedTeamMemberId: r.assignedTeamMemberId, _count: { _all: 0 }, status: r.status }
          map[key]._count._all += 1
        }
        return Object.values(map)
      }),
      findMany: vi.fn(async ({ where, select, orderBy, take }: any) => {
        let rows = db.serviceRequests
        if (where?.assignedTeamMemberId) rows = rows.filter((r: any) => r.assignedTeamMemberId === where.assignedTeamMemberId)
        return rows.map((r: any) => ({
          id: r.id,
          title: `SR ${r.id}`,
          priority: r.priority,
          status: r.status,
          assignedTeamMemberId: r.assignedTeamMemberId,
          assignedAt: new Date().toISOString(),
          assignedBy: 'admin1',
          client: { id: 'c1', name: 'Client', email: 'c@example.com' },
          service: { id: 'svc1', name: 'Service' },
        }))
      }),
    },
  },
}))

describe('admin/team-management routes', () => {
  beforeEach(() => {
    Object.assign(process.env, originalEnv)
  })
  afterEach(() => {
    vi.resetModules()
  })

  it('workload GET returns fallback when DB is not configured', async () => {
    const mod: any = await import('@/app/api/admin/team-management/workload/route')
    const res: any = await mod.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  it('availability GET returns fallback when DB is not configured', async () => {
    const mod: any = await import('@/app/api/admin/team-management/availability/route')
    const res: any = await mod.GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('skills PATCH updates when DB env is set', async () => {
    process.env.NETLIFY_DATABASE_URL = 'postgres://test'
    vi.resetModules()
    const { PATCH }: any = await import('@/app/api/admin/team-management/skills/route')
    const payload = { memberId: 'm1', specialties: ['tax', 'vat'] }
    const res: any = await PATCH(new Request('https://x', { method: 'PATCH', body: JSON.stringify(payload) }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.id).toBe('m1')
    expect(json.data.specialties).toEqual(['tax', 'vat'])
  })

  it('assignments GET respects memberId filter when DB env is set', async () => {
    process.env.NETLIFY_DATABASE_URL = 'postgres://test'
    vi.resetModules()
    const mod: any = await import('@/app/api/admin/team-management/assignments/route')
    const res: any = await mod.GET(new Request('https://x?memberId=m1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.every((r: any) => r.assignedTeamMemberId === 'm1')).toBe(true)
  })
})
