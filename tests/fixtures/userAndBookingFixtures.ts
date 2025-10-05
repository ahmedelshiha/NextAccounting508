import prisma from '@/lib/prisma'
import { resolveTenantId } from '@/lib/default-tenant'

export async function seedUser(opts: { email?: string; name?: string; tenantId?: string }) {
  const email = opts.email ?? `test.user.${Date.now()}@example.test`
  const name = opts.name ?? 'Test User'
  const tenantId = await resolveTenantId(opts.tenantId ?? null)
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: 'CLIENT',
      tenant: { connect: { id: tenantId } },
    },
  })
  return user
}

export async function cleanupUserByEmail(email: string) {
  try { await prisma.user.deleteMany({ where: { email } }) } catch {}
}

export async function seedBooking(opts: { serviceId: string; clientId?: string; scheduledAt: Date; duration?: number; tenantId?: string }) {
  const { serviceId, clientId, scheduledAt, duration = 60, tenantId } = opts
  const client = clientId ? null : await seedUser({})
  const resolvedTenant = await resolveTenantId(tenantId ?? null)
  const booking = await prisma.booking.create({ data: {
    client: { connect: { id: clientId ?? client!.id } },
    service: { connect: { id: serviceId } },
    tenant: { connect: { id: resolvedTenant } },
    status: 'PENDING',
    scheduledAt,
    duration,
    clientName: 'Fixture Client',
    clientEmail: 'fixture.client@example.test',
  }})
  return booking
}

export async function cleanupBookingsForTenant(tenantId: string) {
  try {
    const svcs = await prisma.service.findMany({ where: { tenantId }, select: { id: true } }).catch(() => [])
    const ids = svcs.map(s => s.id)
    if (ids.length) await prisma.booking.deleteMany({ where: { serviceId: { in: ids } } })
  } catch {}
}
