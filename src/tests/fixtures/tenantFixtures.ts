import prisma from '@/lib/prisma'

export async function cleanupTenant(tenantId: string) {
  try {
    // Attempt to remove organization settings and related rows for the tenant
    if ((prisma as any)?.organizationSettings?.deleteMany) {
      await (prisma as any).organizationSettings.deleteMany({ where: { tenantId } })
    }
    if ((prisma as any)?.bookings?.deleteMany) {
      await (prisma as any).bookings.deleteMany({ where: { tenantId } })
    }
  } catch (err) {
    // ignore errors in cleanup for test environments
    // eslint-disable-next-line no-console
    console.warn('[tenantFixtures] cleanupTenant failed', err && (err as any).message)
  }
}

export async function setupTenant(tenantId: string, data: any = {}) {
  try {
    if ((prisma as any)?.organizationSettings?.upsert) {
      await (prisma as any).organizationSettings.upsert({ where: { tenantId }, update: data, create: { tenantId, ...data } })
    }
  } catch (err) {
    // ignore
    // eslint-disable-next-line no-console
    console.warn('[tenantFixtures] setupTenant failed', err && (err as any).message)
  }
}

export default { cleanupTenant, setupTenant }
