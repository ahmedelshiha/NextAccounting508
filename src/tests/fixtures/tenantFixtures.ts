// eslint-disable-next-line @typescript-eslint/no-require-imports
const prisma: any = (typeof globalThis !== 'undefined' && (globalThis as any).prisma) || require('@/lib/prisma').default

export async function seedTenantWithService(opts: { tenantId: string, timezone?: string, serviceSlug?: string, serviceName?: string, businessHours?: Record<string, string>, tx?: { registerCreated: (model:string,id:string)=>void } }) {
  const { tenantId, timezone = 'UTC', serviceSlug, serviceName, businessHours, tx } = opts
  try { await (prisma as any).organizationSettings.deleteMany({ where: { tenantId } }) } catch {}
  try { await (prisma as any).service.deleteMany({ where: { tenantId } }) } catch {}

  const org = await (prisma as any).organizationSettings.create({ data: { tenantId, name: `${tenantId} Org`, defaultTimezone: timezone } })
  if (tx && typeof tx.registerCreated === 'function') tx.registerCreated('organizationSettings', org.id)

  const svc = await (prisma as any).service.create({ data: {
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
  try {
    const deleteFn1: any = (prisma as any).service?.deleteMany
    if (deleteFn1) await deleteFn1({ where: { tenantId } })
  } catch {}
  try {
    const deleteFn2: any = (prisma as any).organizationSettings?.deleteMany
    if (deleteFn2) await deleteFn2({ where: { tenantId } })
  } catch {}
  try {
    // Delete bookings for services that belong to this tenant
    const findFn: any = (prisma as any).service?.findMany
    const svcs: any[] = findFn ? await findFn({ where: { tenantId }, select: { id: true } }) : []
    const ids = (svcs || []).map((s: any) => s.id)
    if (ids.length) {
      const deleteFn3: any = (prisma as any).booking?.deleteMany
      if (deleteFn3) await deleteFn3({ where: { serviceId: { in: ids } } })
    }
  } catch {}
}
