import { describe, it, expect, beforeEach, vi } from 'vitest'

// In-memory prisma mock for BookingSettings used by service and routes
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
  bookingStepConfig: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findMany: async () => [] },
  businessHoursConfig: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findMany: async () => [] },
  paymentMethodConfig: { upsert: async () => ({}), findMany: async () => [], deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }) },
  notificationTemplate: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }) },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))

beforeEach(() => { db.settings.length = 0 })

const base = 'https://t1.example.com'

describe('admin/booking-settings sub-endpoints', () => {
  it('automation, integrations, capacity, and forms PUT succeed with valid payloads', async () => {
    const main = await import('@/app/api/admin/booking-settings/route')
    const auto = await import('@/app/api/admin/booking-settings/automation/route')
    const integ = await import('@/app/api/admin/booking-settings/integrations/route')
    const cap = await import('@/app/api/admin/booking-settings/capacity/route')
    const forms = await import('@/app/api/admin/booking-settings/forms/route')

    // Ensure defaults exist
    await main.GET(new Request(`${base}/api/admin/booking-settings`))

    const resAuto: any = await auto.PUT(new Request(`${base}/api/admin/booking-settings/automation`, { method: 'PUT', body: JSON.stringify({ automation: { autoConfirm: true, confirmIf: 'known-client', followUps: [], cancellationPolicy: { hoursBefore: 24, feePercent: 0 } } }) }))
    expect(resAuto.status).toBe(200)
    const outAuto = await resAuto.json(); expect(outAuto.automation).toBeDefined()

    const resInteg: any = await integ.PUT(new Request(`${base}/api/admin/booking-settings/integrations`, { method: 'PUT', body: JSON.stringify({ integrations: { calendarSync: 'none', conferencing: 'none' } }) }))
    expect(resInteg.status).toBe(200)
    const outInteg = await resInteg.json(); expect(outInteg.integrations).toBeDefined()

    const resCap: any = await cap.PUT(new Request(`${base}/api/admin/booking-settings/capacity`, { method: 'PUT', body: JSON.stringify({ capacity: { pooledResources: false, concurrentLimit: 5, waitlist: false } }) }))
    expect(resCap.status).toBe(200)
    const outCap = await resCap.json(); expect(outCap.capacity).toBeDefined()

    const resForms: any = await forms.PUT(new Request(`${base}/api/admin/booking-settings/forms`, { method: 'PUT', body: JSON.stringify({ forms: { fields: [], rules: [] } }) }))
    expect(resForms.status).toBe(200)
    const outForms = await resForms.json(); expect(outForms.forms).toBeDefined()
  })
})
