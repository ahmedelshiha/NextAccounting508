// eslint-disable-next-line @typescript-eslint/no-require-imports
const prismaModule: any = (typeof globalThis !== 'undefined' && (globalThis as any).prisma) || require('@/lib/prisma').default
const prisma: any = prismaModule

export async function seedTenantWithService(opts: { tenantId: string, timezone?: string, serviceSlug?: string, serviceName?: string, businessHours?: Record<string, string>, tx?: { registerCreated: (model:string,id:string)=>void } }) {
  const { tenantId, timezone = 'UTC', serviceSlug, serviceName, businessHours, tx } = opts
  try { await prisma.organizationSettings.deleteMany({ where: { tenantId } }) } catch {}
  try { await prisma.service.deleteMany({ where: { tenantId } }) } catch {}

  const org = await prisma.organizationSettings.create({ data: { tenantId, name: `${tenantId} Org`, defaultTimezone: timezone } })
  if (tx && typeof tx.registerCreated === 'function') tx.registerCreated('organizationSettings', org.id)

  const svc = await prisma.service.create({ data: {
    name: serviceName ?? 'Fixture Service',
    slug: serviceSlug ?? `fixture-${Date.now()}`,
    description: 'Seeded service for tests',
    price: 100,
    duration: 60,
    tenant: { connect: { id: tenantId } },
    businessHours: businessHours ?? { '1': '09:00-17:00', '2': '09:00-17:00', '3': '09:00-17:00', '4': '09:00-17:00', '5': '09:00-17:00' }
  }})
  if (tx && typeof tx.registerCreated === 'function') tx.registerCreated('service', svc.id)

  return svc
}

export async function cleanupTenant(tenantId: string): Promise<void> {
  try { await prisma.service.deleteMany({ where: { tenantId } }) } catch {}
  try { await prisma.organizationSettings.deleteMany({ where: { tenantId } }) } catch {}
  try {
    const svcs: any[] = await prisma.service.findMany({ where: { tenantId }, select: { id: true } })
    const ids = (svcs || []).map((s: any) => s.id)
    if (ids.length) await prisma.booking.deleteMany({ where: { serviceId: { in: ids } } })
  } catch {}
}
