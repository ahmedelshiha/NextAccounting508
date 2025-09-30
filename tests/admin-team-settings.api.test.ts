vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const db: any = { items: [] }
const genId = () => 't_' + Math.random().toString(36).slice(2)

const prismaMock = {
  teamSettings: {
    findFirst: async ({ where }: any) => db.items.find((o: any) => (where?.tenantId ?? null) === (o.tenantId ?? null)) || null,
    findUnique: async ({ where }: any) => db.items.find((o: any) => o.id === where.id) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), ...data }; db.items.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.items.find((x: any) => x.id === where.id || x.tenantId === (where.tenantId ?? null)); if (!s) throw new Error('not found'); Object.assign(s, data); s.updatedAt = new Date(); return s }
  }
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))

beforeEach(() => { db.items.length = 0 })

const base = 'https://t1.example.com'

describe('admin/team-settings API', () => {
  it('GET returns defaults when missing', async () => {
    const mod = await import('@/app/api/admin/team-settings/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/team-settings`))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
    expect(json.structure).toBeDefined()
  })

  it('PUT rejects invalid payload (400)', async () => {
    const mod = await import('@/app/api/admin/team-settings/route')
    const payload = { availability: { minimumHoursNotice: -5 } }
    const res: any = await mod.PUT(new Request(`${base}/api/admin/team-settings`, { method: 'PUT', body: JSON.stringify(payload) }))
    expect(res.status).toBe(400)
    const out = await res.json()
    expect(out.error).toBeDefined()
  })

  it('PUT accepts valid update and persists (200)', async () => {
    const mod = await import('@/app/api/admin/team-settings/route')
    const payload = { availability: { allowFlexibleHours: true, minimumHoursNotice: 12 } }
    const res: any = await mod.PUT(new Request(`${base}/api/admin/team-settings`, { method: 'PUT', body: JSON.stringify(payload) }))
    expect(res.status).toBe(200)
    const out = await res.json()
    expect(out.availability).toBeDefined()
    expect(out.availability.allowFlexibleHours).toBe(true)
  })
})
