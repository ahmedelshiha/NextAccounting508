import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const db: any = { rows: [] }
const genId = () => 'fin_' + Math.random().toString(36).slice(2)

const prismaMock = {
  financialSettings: {
    findFirst: async ({ where }: any) => db.rows.find((o: any) => (where?.tenantId ?? null) === (o.tenantId ?? null)) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), ...data }; db.rows.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.rows.find((x: any) => x.id === where.id || x.tenantId === (where.tenantId ?? null)); if (!s) throw new Error('not found'); Object.assign(s, data); s.updatedAt = new Date(); return s }
  }
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))

beforeEach(() => { db.rows.length = 0 })

const base = 'https://t1.example.com'

describe('admin/financial-settings API', () => {
  it('GET unauthorized without role', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => null) }))
    const mod = await import('@/app/api/admin/financial-settings/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/financial-settings`))
    expect(res.status).toBe(401)
  })

  it('PUT requires FINANCIAL_SETTINGS_EDIT', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'TEAM_MEMBER' } })) }))
    const mod = await import('@/app/api/admin/financial-settings/route')
    const res: any = await mod.PUT(new Request(`${base}/api/admin/financial-settings`, { method: 'PUT', body: JSON.stringify({ invoicing: { invoicePrefix: 'AC' } }) }))
    expect(res.status).toBe(401)
  })

  it('PUT accepts valid payload for ADMIN', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
    const mod = await import('@/app/api/admin/financial-settings/route')
    const res: any = await mod.PUT(new Request(`${base}/api/admin/financial-settings`, { method: 'PUT', body: JSON.stringify({ invoicing: { invoicePrefix: 'AC' } }) }))
    expect(res.status).toBe(200)
    const out = await res.json()
    expect(out.settings).toBeDefined()
    expect(out.settings.invoicing.invoicePrefix).toBe('AC')
  })
})
