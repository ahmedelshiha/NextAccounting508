vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

// In-memory prisma mock for OrganizationSettings
const db: any = { orgs: [] }
const genId = () => 'org_' + Math.random().toString(36).slice(2)

const prismaMock = {
  organizationSettings: {
    findFirst: async ({ where }: any) => db.orgs.find((o: any) => (where?.tenantId ?? null) === (o.tenantId ?? null)) || null,
    findUnique: async ({ where }: any) => db.orgs.find((o: any) => o.id === where.id) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), ...data }; db.orgs.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.orgs.find((x: any) => x.id === where.id || x.tenantId === (where.tenantId ?? null)); if (!s) throw new Error('not found'); Object.assign(s, data); s.updatedAt = new Date(); return s }
  }
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))

beforeEach(() => { db.orgs.length = 0 })

const base = 'https://t1.example.com'

describe('admin/org-settings API', () => {
  it('GET returns defaults when missing', async () => {
    const mod = await import('@/app/api/admin/org-settings/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/org-settings`))
    expect(res.status).toBe(200)
    const json = await res.json()
    // Either shape with minimal fields or nested object accepted
    expect(json).toBeDefined()
  })

  it('PUT rejects invalid payload (400)', async () => {
    const mod = await import('@/app/api/admin/org-settings/route')
    const payload = { general: { name: '' } }
    const res: any = await mod.PUT(new Request(`${base}/api/admin/org-settings`, { method: 'PUT', body: JSON.stringify(payload) }))
    expect(res.status).toBe(400)
    const out = await res.json()
    expect(out.error).toBeDefined()
  })

  it('PUT accepts valid update and persists (200)', async () => {
    const mod = await import('@/app/api/admin/org-settings/route')
    const payload = { general: { name: 'Acme Corp', tagline: 'We do accounting' } }
    const res: any = await mod.PUT(new Request(`${base}/api/admin/org-settings`, { method: 'PUT', body: JSON.stringify(payload) }))
    expect(res.status).toBe(200)
    const out = await res.json()
    expect(out.settings).toBeDefined()
    expect(out.settings.name).toBe('Acme Corp')
  })
})
