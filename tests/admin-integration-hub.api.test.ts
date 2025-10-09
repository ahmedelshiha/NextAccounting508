import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({
  hasPermission: vi.fn((role: string, perm: string) => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true
    return false
  }),
  PERMISSIONS: {
    INTEGRATION_HUB_VIEW: 'integration.hub.view',
    INTEGRATION_HUB_EDIT: 'integration.hub.edit'
  }
}))

const db: any = { rows: [] }
const genId = () => 'int_' + Math.random().toString(36).slice(2)

const prismaMock = {
  integrationSettings: {
    findFirst: async ({ where }: any) => db.rows.find((o: any) => (where?.tenantId ?? null) === (o.tenantId ?? null)) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), ...data }; db.rows.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.rows.find((x: any) => x.id === where.id || x.tenantId === (where.tenantId ?? null)); if (!s) throw new Error('not found'); Object.assign(s, data); s.updatedAt = new Date(); return s }
  }
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))
vi.mock('@/lib/tenant', () => ({ 
  tenantFilter: vi.fn((tenantId: string | null) => ({ tenantId }))
}))
vi.mock('@/lib/default-tenant', () => ({
  resolveTenantId: vi.fn(async (tenantId: string | null) => tenantId || 'default-tenant')
}))

beforeEach(() => { db.rows.length = 0 })

const base = 'https://t1.example.com'

describe('admin/integration-hub API', () => {
  it('GET denies when unauthenticated', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => null) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => null) }))
    const mod = await import('@/app/api/admin/integration-hub/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/integration-hub`))
    expect(res.status).toBe(401)
  })

  it('PUT requires edit permission', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'TEAM_MEMBER' } })) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'TEAM_MEMBER', tenantId: 'test-tenant' } })) }))
    const mod = await import('@/app/api/admin/integration-hub/route')
    const res: any = await mod.PUT(new Request(`${base}/api/admin/integration-hub`, { method: 'PUT', body: JSON.stringify({ payments: { provider: 'stripe' } }) }))
    expect(res.status).toBe(401)
  })

  it('PUT accepts for ADMIN and masks keys', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 'test-tenant' } })) }))
    const mod = await import('@/app/api/admin/integration-hub/route')
    const res: any = await mod.PUT(new Request(`${base}/api/admin/integration-hub`, { method: 'PUT', body: JSON.stringify({ payments: { provider: 'stripe', publishableKey: 'pk_live_1234567890', secretKey: 'sk_live_abcdef' } }) }))
    expect(res.status).toBe(200)
    const out = await res.json()
    expect(out.settings?.payments?.publishableKeyMasked).toContain('***')
    expect(out.settings?.payments?.hasSecret).toBe(true)
  })

  it('test endpoint validates simple patterns', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 'test-tenant' } })) }))
    const mod = await import('@/app/api/admin/integration-hub/test/route')
    const ok: any = await mod.POST(new Request(`${base}/api/admin/integration-hub/test`, { method: 'POST', body: JSON.stringify({ provider: 'stripe', payload: { publishableKey: 'pk_live_12345678' } }) }))
    expect(ok.status).toBe(200)
    const bad: any = await mod.POST(new Request(`${base}/api/admin/integration-hub/test`, { method: 'POST', body: JSON.stringify({ provider: 'sendgrid', payload: { apiKey: 'BADKEY' } }) }))
    expect(bad.status).toBe(400)
  })
})
