// Negative tests for booking-settings API payload validation

// In-memory prisma mock covering BookingSettings used by routes via service
const db = { settings: [] as any[] }
const genId = () => 'bs_' + Math.random().toString(36).slice(2)

const prismaMock = {
  $transaction: async (fn: any) => fn(prismaMock),
  bookingSettings: {
    findFirst: async ({ where }: any) => db.settings.find((s) => (where?.tenantId ?? null) === (s.tenantId ?? null)) || null,
    findUnique: async ({ where }: any) => db.settings.find((s) => s.id === where.id) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), updatedBy: null, ...data }; db.settings.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.settings.find((x) => (where.id ? x.id === where.id : x.tenantId === (where.tenantId ?? null))); if (!s) throw new Error('not found'); const dataCopy = { ...data }; delete dataCopy.id; Object.assign(s, dataCopy); s.updatedAt = new Date(); return s },
    delete: async ({ where }: any) => { const i = db.settings.findIndex((x) => x.id === where.id); if (i>=0) db.settings.splice(i,1); return { id: where.id } },
  },
  bookingStepConfig: {
    deleteMany: async ({ where }: any) => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
    findMany: async () => [],
  },
  businessHoursConfig: {
    deleteMany: async () => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
    findMany: async () => [],
  },
  paymentMethodConfig: {
    upsert: async () => ({}),
    findMany: async () => [],
    deleteMany: async () => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
  },
  notificationTemplate: {
    deleteMany: async () => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))

beforeEach(() => { db.settings.length = 0 })

const base = 'https://t1.example.com'

describe('admin/booking-settings API - invalid payloads', () => {
  it('steps route rejects non-array payload', async () => {
    const stepsMod = await import('@/app/api/admin/booking-settings/steps/route')
    // ensure defaults exist
    const main = await import('@/app/api/admin/booking-settings/route')
    await main.GET(new Request(`${base}/api/admin/booking-settings`))

    const res: any = await stepsMod.PUT(new Request(`${base}/api/admin/booking-settings/steps`, { method: 'PUT', body: JSON.stringify({ steps: 'not-an-array' }) }))
    expect(res.status).toBe(400)
    const out = await res.json()
    expect(out.error).toBe('Invalid payload')
    expect(out.details).toBeDefined()
  })

  it('business-hours route rejects invalid payload', async () => {
    const bhMod = await import('@/app/api/admin/booking-settings/business-hours/route')
    const main = await import('@/app/api/admin/booking-settings/route')
    await main.GET(new Request(`${base}/api/admin/booking-settings`))

    const res: any = await bhMod.PUT(new Request(`${base}/api/admin/booking-settings/business-hours`, { method: 'PUT', body: JSON.stringify({ businessHours: 'invalid' }) }))
    expect(res.status).toBe(400)
    const out = await res.json()
    expect(out.error).toBe('Invalid payload')
    expect(out.details).toBeDefined()
  })

  it('payment-methods route rejects invalid payload', async () => {
    const pmMod = await import('@/app/api/admin/booking-settings/payment-methods/route')
    const main = await import('@/app/api/admin/booking-settings/route')
    await main.GET(new Request(`${base}/api/admin/booking-settings`))

    const res: any = await pmMod.PUT(new Request(`${base}/api/admin/booking-settings/payment-methods`, { method: 'PUT', body: JSON.stringify({ paymentMethods: 'nope' }) }))
    expect(res.status).toBe(400)
    const out = await res.json()
    expect(out.error).toBe('Invalid payload')
    expect(out.details).toBeDefined()
  })
})
