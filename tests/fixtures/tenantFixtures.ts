import prismaDefault from '@/lib/prisma'

const prisma: any = (typeof globalThis !== 'undefined' && (globalThis as any).prisma) || (prismaDefault as any)

export async function seedTenantWithService(opts: { tenantId: string, timezone?: string, serviceSlug?: string, serviceName?: string, businessHours?: Record<string, string>, tx?: { registerCreated: (model:string,id:string)=>void } }) {
  const { tenantId, timezone = 'UTC', serviceSlug, serviceName, businessHours, tx } = opts
  try { await prisma.organizationSettings.deleteMany({ where: { tenantId } }) } catch {}
  try { await prisma.service.deleteMany({ where: { tenantId } }) } catch {}

  const org = await (prisma as any).organizationSettings.create({ data: { tenantId, name: `${tenantId} Org`, defaultTimezone: timezone } })
  if (tx && typeof tx.registerCreated === 'function') tx.registerCreated('organizationSettings', org.id)

  const svc = await (prisma as any).service.create({ data: {
    name: serviceName ?? 'Fixture Service',
    slug: serviceSlug ?? `fixture-${Date.now()}`,
    description: 'Seeded service for tests',
    price: 100,
    duration: 60,
    tenant: { connect: { id: tenantId } },
    businessHours: businessHours ?? { '0': '09:00-17:00', '1': '09:00-17:00', '2': '09:00-17:00', '3': '09:00-17:00', '4': '09:00-17:00', '5': '09:00-17:00', '6': '09:00-17:00' }
  }})
  if (tx && typeof tx.registerCreated === 'function') tx.registerCreated('service', svc.id)

  // If the project-level prisma mock exposes setModelMethod, register a findUnique that returns this created service
  try {
    // require the project mock; path is relative to tests/fixtures
     
    const mockPrismaModule: any = require('../../__mocks__/prisma')
    if (mockPrismaModule && typeof mockPrismaModule.setModelMethod === 'function') {
      mockPrismaModule.setModelMethod('service', 'findUnique', async (params: any = {}) => {
        const where: any = params?.where
        if (where && where.id) {
          if (String(where.id) === String(svc.id)) return svc
        }
        return null
      })
    }
  } catch (err) {
    // ignore if mock not present
  }

  try {
    ;(globalThis as any).__seededServices = (globalThis as any).__seededServices || {}
    ;(globalThis as any).__seededServices[svc.id] = svc
  } catch {}

  return svc
}

export async function cleanupTenant(tenantId: string) {
  try {
    await prisma.service.deleteMany({ where: { tenantId } })
  } catch {}
  try {
    await prisma.organizationSettings.deleteMany({ where: { tenantId } })
  } catch {}
  try {
    // Delete bookings for services that belong to this tenant
    const svcs = await prisma.service.findMany({ where: { tenantId }, select: { id: true } }).catch(() => [])
    const ids = (svcs || []).map((s: any) => s.id)
    if (ids.length) await prisma.booking.deleteMany({ where: { serviceId: { in: ids } } })
  } catch {}
}
