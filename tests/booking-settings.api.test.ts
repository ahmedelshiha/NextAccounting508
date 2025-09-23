import { describe, it, expect, vi, beforeEach } from 'vitest'

// In-memory prisma mock covering BookingSettings used by routes via service
const db = { settings: [] as any[] }
const genId = () => 'bs_' + Math.random().toString(36).slice(2)

const prismaMock = {
  $transaction: async (fn: any) => fn(prismaMock),
  bookingSettings: {
    findFirst: async ({ where }: any) => db.settings.find((s) => (where?.tenantId ?? null) === (s.tenantId ?? null)) || null,
    findUnique: async ({ where }: any) => db.settings.find((s) => s.id === where.id) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), updatedBy: null, ...data }
      db.settings.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.settings.find((x) => (where.id ? x.id === where.id : x.tenantId === (where.tenantId ?? null)))
      if (!s) throw new Error('not found'); Object.assign(s, data); s.updatedAt = new Date(); return s },
    delete: async ({ where }: any) => { const i = db.settings.findIndex((x) => x.id === where.id); if (i>=0) db.settings.splice(i,1); return { id: where.id } },
  },
  bookingStepConfig: {
    deleteMany: async ({ where }: any) => { return { count: 0 } },
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

describe('admin/booking-settings API', () => {
  it('GET returns settings (creates defaults when missing)', async () => {
    const mod = await import('@/app/api/admin/booking-settings/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/booking-settings`))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json?.id).toBeDefined()
  })

  it('PUT validates and rejects invalid updates', async () => {
    const mod = await import('@/app/api/admin/booking-settings/route')
    // ensure default exists
    await mod.GET(new Request(`${base}/api/admin/booking-settings`))
    const payload = { stepSettings: { enableCustomerDetails: false } }
    const res: any = await mod.PUT(new Request(`${base}/api/admin/booking-settings`, { method: 'PUT', body: JSON.stringify(payload) }))
    expect(res.status).toBe(400)
    const out = await res.json()
    expect(Array.isArray(out.errors)).toBe(true)
  })

  it('PUT accepts a valid minimal update (200)', async () => {
    const mod = await import('@/app/api/admin/booking-settings/route')
    await mod.GET(new Request(`${base}/api/admin/booking-settings`))
    const res: any = await mod.PUT(new Request(`${base}/api/admin/booking-settings`, { method: 'PUT', body: JSON.stringify({}) }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json?.settings?.id).toBeDefined()
  })

  it('export and reset routes respond successfully', async () => {
    const expMod = await import('@/app/api/admin/booking-settings/export/route')
    const resetMod = await import('@/app/api/admin/booking-settings/reset/route')
    // create defaults
    const main = await import('@/app/api/admin/booking-settings/route')
    await main.GET(new Request(`${base}/api/admin/booking-settings`))

    const res1: any = await expMod.GET(new Request(`${base}/api/admin/booking-settings/export`))
    expect(res1.status).toBe(200)
    const data = await res1.json()
    expect(data.version).toBe('1.0.0')

    const res2: any = await resetMod.POST(new Request(`${base}/api/admin/booking-settings/reset`, { method: 'POST' }))
    expect(res2.status).toBe(200)
  })

  it('import route accepts exported payload (200)', async () => {
    const main = await import('@/app/api/admin/booking-settings/route')
    const expMod = await import('@/app/api/admin/booking-settings/export/route')
    const impMod = await import('@/app/api/admin/booking-settings/import/route')

    await main.GET(new Request(`${base}/api/admin/booking-settings`))
    const resExport: any = await expMod.GET(new Request(`${base}/api/admin/booking-settings/export`))
    const exported = await resExport.json()

    const importBody = { data: exported, overwriteExisting: true, selectedSections: ['settings','steps','businessHours','paymentMethods','notifications'] }
    const resImport: any = await impMod.POST(new Request(`${base}/api/admin/booking-settings/import`, { method: 'POST', body: JSON.stringify(importBody) }))
    expect(resImport.status).toBe(200)
    const out = await resImport.json()
    expect(out?.settings?.id).toBeDefined()
  })

  it('business-hours, steps, and payment-methods routes update when settings exist', async () => {
    const main = await import('@/app/api/admin/booking-settings/route')
    const bh = await import('@/app/api/admin/booking-settings/business-hours/route')
    const pm = await import('@/app/api/admin/booking-settings/payment-methods/route')

    await main.GET(new Request(`${base}/api/admin/booking-settings`))

    const resBh: any = await bh.PUT(new Request(`${base}/api/admin/booking-settings/business-hours`, { method: 'PUT', body: JSON.stringify({ businessHours: [{ dayOfWeek: 2, isWorkingDay: true }, { dayOfWeek: 1, isWorkingDay: true }] }) }))
    expect(resBh.status).toBe(200)

    const steps = await import('@/app/api/admin/booking-settings/steps/route')
    const resSteps: any = await steps.PUT(new Request(`${base}/api/admin/booking-settings/steps`, { method: 'PUT', body: JSON.stringify({ steps: [
      { stepName: 'X', stepOrder: 2, enabled: true, required: true, title: 'X' },
      { stepName: 'A', stepOrder: 1, enabled: true, required: true, title: 'A' },
    ] }) }))
    expect(resSteps.status).toBe(200)

    const resPm: any = await pm.PUT(new Request(`${base}/api/admin/booking-settings/payment-methods`, { method: 'PUT', body: JSON.stringify({ paymentMethods: [{ methodType: 'CARD', enabled: true }] }) }))
    expect(resPm.status).toBe(200)
  })
})
