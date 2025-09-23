import { describe, it, expect, vi, beforeEach } from 'vitest'

// Minimal prisma mock used by service/routes
const db = { settings: [] as any[] }
const genId = () => 'bs_' + Math.random().toString(36).slice(2)

const prismaMock = {
  $transaction: async (fn: any) => fn(prismaMock),
  bookingSettings: {
    findFirst: async ({ where }: any) => db.settings.find((s) => (where?.tenantId ?? null) === (s.tenantId ?? null)) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), updatedBy: null, ...data }; db.settings.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.settings.find((x) => (where.id ? x.id === where.id : x.tenantId === (where.tenantId ?? null))); if (!s) throw new Error('not found'); Object.assign(s, data); s.updatedAt = new Date(); return s },
  },
  bookingStepConfig: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findMany: async () => [] },
  businessHoursConfig: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findMany: async () => [] },
  paymentMethodConfig: { upsert: async () => ({}), findMany: async () => [], deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }) },
  notificationTemplate: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }) },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))

function mockSession(role: string | null) {
  const session = role ? { user: { id: 'u1', role, email: 't@e.com', name: 'T' } } : null
  vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => session) }))
  vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => session) }))
}

beforeEach(() => { db.settings.length = 0; vi.resetModules() })

const base = 'https://t1.example.com'

describe('admin/booking-settings API RBAC', () => {
  it('GET returns 401 when no session', async () => {
    mockSession(null)
    const mod = await import('@/app/api/admin/booking-settings/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/booking-settings`))
    expect(res.status).toBe(401)
  })

  it('GET returns 401 for CLIENT role', async () => {
    mockSession('CLIENT')
    const mod = await import('@/app/api/admin/booking-settings/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/booking-settings`))
    expect(res.status).toBe(401)
  })

  it('IMPORT returns 401 for TEAM_LEAD (no import permission)', async () => {
    mockSession('TEAM_LEAD')
    const mod = await import('@/app/api/admin/booking-settings/import/route')
    const res: any = await mod.POST(new Request(`${base}/api/admin/booking-settings/import`, { method: 'POST', body: JSON.stringify({ data: { version: '1.0.0', settings: {}, steps: [], businessHours: [], paymentMethods: [], notificationTemplates: [], exportedAt: new Date().toISOString(), }, overwriteExisting: false, selectedSections: [] }) }))
    expect(res.status).toBe(401)
  })

  it('RESET returns 200 for ADMIN role', async () => {
    mockSession('ADMIN')
    const mod = await import('@/app/api/admin/booking-settings/reset/route')
    // Ensure defaults exist first via GET
    const main = await import('@/app/api/admin/booking-settings/route')
    await main.GET(new Request(`${base}/api/admin/booking-settings`))
    const res: any = await mod.POST(new Request(`${base}/api/admin/booking-settings/reset`, { method: 'POST' }))
    expect(res.status).toBe(200)
  })
})
