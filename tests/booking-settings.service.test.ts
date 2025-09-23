import { describe, it, expect, vi, beforeEach } from 'vitest'

// Minimal in-memory mocks for prisma models used by the service
const db = {
  bookingSettings: [] as any[],
  steps: [] as any[],
  hours: [] as any[],
  methods: [] as any[],
  templates: [] as any[],
}

const genId = () => 'bs_' + Math.random().toString(36).slice(2)

const prismaMock = {
  $transaction: async (fn: any) => fn(prismaMock),
  bookingSettings: {
    findFirst: async ({ where }: any) => db.bookingSettings.find((s) => (where?.tenantId ?? null) === (s.tenantId ?? null)) || null,
    findUnique: async ({ where }: any) => db.bookingSettings.find((s) => s.id === where.id) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), updatedBy: null, ...data }
      db.bookingSettings.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.bookingSettings.find((x) => (where.id ? x.id === where.id : x.tenantId === (where.tenantId ?? null)))
      if (!s) throw new Error('not found'); Object.assign(s, data); s.updatedAt = new Date(); return s },
    delete: async ({ where }: any) => { const i = db.bookingSettings.findIndex((x) => x.id === where.id); if (i>=0) db.bookingSettings.splice(i,1); return { id: where.id } },
  },
  bookingStepConfig: {
    deleteMany: async ({ where }: any) => { const before = db.steps.length; db.steps = db.steps.filter((x) => x.bookingSettingsId !== where.bookingSettingsId); return { count: before - db.steps.length } },
    createMany: async ({ data }: any) => { const rows = Array.isArray(data) ? data : [data]; db.steps.push(...rows.map((r) => ({ id: genId(), ...r }))); return { count: rows.length } },
    findMany: async ({ where, orderBy }: any) => db.steps.filter((x) => x.bookingSettingsId === where.bookingSettingsId).sort((a,b)=> (a[orderBy.stepOrder]||0)-(b[orderBy.stepOrder]||0)),
  },
  businessHoursConfig: {
    deleteMany: async ({ where }: any) => { const before = db.hours.length; db.hours = db.hours.filter((x) => x.bookingSettingsId !== where.bookingSettingsId); return { count: before - db.hours.length } },
    createMany: async ({ data }: any) => { const rows = Array.isArray(data) ? data : [data]; db.hours.push(...rows.map((r) => ({ id: genId(), ...r }))); return { count: rows.length } },
    findMany: async ({ where, orderBy }: any) => db.hours.filter((x) => x.bookingSettingsId === where.bookingSettingsId).sort((a,b)=> (a[orderBy.dayOfWeek]||0)-(b[orderBy.dayOfWeek]||0)),
  },
  paymentMethodConfig: {
    upsert: async ({ where, update, create }: any) => {
      const i = db.methods.findIndex((m) => m.bookingSettingsId === where.bookingSettingsId_methodType.bookingSettingsId && m.methodType === where.bookingSettingsId_methodType.methodType)
      if (i >= 0) { db.methods[i] = { ...db.methods[i], ...update }; return db.methods[i] }
      const row = { id: genId(), ...create }; db.methods.push(row); return row
    },
    findMany: async ({ where }: any) => db.methods.filter((m) => m.bookingSettingsId === where.bookingSettingsId),
    deleteMany: async ({ where }: any) => { const before = db.methods.length; db.methods = db.methods.filter((x) => x.bookingSettingsId !== where.bookingSettingsId); return { count: before - db.methods.length } },
    createMany: async ({ data }: any) => { const rows = Array.isArray(data) ? data : [data]; db.methods.push(...rows.map((r) => ({ id: genId(), ...r }))); return { count: rows.length } },
  },
  notificationTemplate: {
    deleteMany: async ({ where }: any) => { const before = db.templates.length; db.templates = db.templates.filter((x) => x.bookingSettingsId !== where.bookingSettingsId); return { count: before - db.templates.length } },
    createMany: async ({ data }: any) => { const rows = Array.isArray(data) ? data : [data]; db.templates.push(...rows.map((r) => ({ id: genId(), ...r }))); return { count: rows.length } },
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

// Silence audit log persistence
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))

beforeEach(() => {
  db.bookingSettings.length = 0
  db.steps.length = 0
  db.hours.length = 0
  db.methods.length = 0
  db.templates.length = 0
})

describe('BookingSettingsService', () => {
  it('validates paymentRequired with no methods -> error', async () => {
    const svc = (await import('@/services/booking-settings.service')).default
    const res = await svc.validateSettingsUpdate(null, { paymentSettings: { paymentRequired: true } as any })
    expect(res.isValid).toBe(false)
    expect(res.errors.some((e) => e.code === 'NO_METHOD')).toBe(true)
  })

  it('creates defaults and caches get results', async () => {
    const svcMod: any = await import('@/services/booking-settings.service')
    const svc = svcMod.default

    const created = await svc.createDefaultSettings(null)
    expect(created).toBeTruthy()

    const spy = vi.spyOn(prismaMock.bookingSettings, 'findFirst')
    const s1 = await svc.getBookingSettings(null)
    const s2 = await svc.getBookingSettings(null)
    expect(s1?.id).toBeDefined()
    expect(s2?.id).toBe(s1?.id)
    // findFirst should be called only once due to cache
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('updates settings and returns hydrated result', async () => {
    const svc = (await import('@/services/booking-settings.service')).default
    await svc.createDefaultSettings('t1')
    const updated = await svc.updateBookingSettings('t1', { generalSettings: { requireApproval: true } })
    expect(updated.requireApproval).toBe(true)
  })

  it('export/import/reset cycle works', async () => {
    const svc = (await import('@/services/booking-settings.service')).default
    await svc.createDefaultSettings('t2')
    const exp = await svc.exportSettings('t2')
    expect(exp.version).toBe('1.0.0')
    expect(exp.steps.length).toBeGreaterThan(0)

    // Modify and import with overwrite
    exp.settings.requireApproval = false
    const afterImport = await svc.importSettings('t2', { data: exp, overwriteExisting: true, selectedSections: ['settings','steps','businessHours','paymentMethods','notifications'] })
    expect(afterImport.requireApproval).toBe(false)

    const afterReset = await svc.resetToDefaults('t2')
    expect(afterReset.id).toBeDefined()
  })

  it('rejects depositPercentage outside 10..100 when allowPartialPayment', async () => {
    const svc = (await import('@/services/booking-settings.service')).default
    let r = await svc.validateSettingsUpdate(null, { paymentSettings: { allowPartialPayment: true, depositPercentage: 5 } as any })
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => e.field === 'depositPercentage' && e.code === 'INVALID_RANGE')).toBe(true)
    r = await svc.validateSettingsUpdate(null, { paymentSettings: { allowPartialPayment: true, depositPercentage: 150 } as any })
    expect(r.isValid).toBe(false)
  })

  it('rejects reminderHours outside 0..8760', async () => {
    const svc = (await import('@/services/booking-settings.service')).default
    const r = await svc.validateSettingsUpdate(null, { notificationSettings: { reminderHours: [-1, 0, 1, 9000] } as any })
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => e.field === 'reminderHours' && e.code === 'INVALID_RANGE')).toBe(true)
  })

  it('rejects pricing surcharges outside 0..2', async () => {
    const svc = (await import('@/services/booking-settings.service')).default
    const r = await svc.validateSettingsUpdate(null, { pricingSettings: { peakHoursSurcharge: -0.1, weekendSurcharge: 2.1 } as any })
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => e.code === 'INVALID_SURCHARGE')).toBe(true)
  })
})
