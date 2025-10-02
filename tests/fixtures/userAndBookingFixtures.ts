import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function seedUser(opts: { email?: string; name?: string, tenantId?: string }) {
  const email = opts.email ?? `test.user.${Date.now()}@example.test`
  const name = opts.name ?? 'Test User'
  const user = await prisma.user.create({ data: { email, name, role: 'CLIENT' } })
  return user
}

export async function cleanupUserByEmail(email: string) {
  try { await prisma.user.deleteMany({ where: { email } }) } catch {}
}

export async function seedBooking(opts: { serviceId: string; clientId?: string; scheduledAt: Date; duration?: number; tenantId?: string }) {
  const { serviceId, clientId, scheduledAt, duration = 60, tenantId } = opts
  const client = clientId ? null : await seedUser({})
  const booking = await prisma.booking.create({ data: {
    clientId: clientId ?? client!.id,
    serviceId,
    status: 'PENDING',
    scheduledAt,
    duration,
    clientName: 'Fixture Client',
    clientEmail: 'fixture.client@example.test',
    tenantId: tenantId ?? undefined
  }})
  return booking
}

export async function cleanupBookingsForTenant(tenantId: string) {
  try { await prisma.booking.deleteMany({ where: { tenantId } }) } catch {}
}
