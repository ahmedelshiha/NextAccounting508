import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '@/lib/prisma'
import { getAvailabilityForService } from '@/lib/booking/availability'
import { DateTime } from 'luxon'

describe('E2E: getAvailabilityForService respects tenant defaultTimezone', () => {
  const tenantId = 'test-tenant-tz'
  let serviceId: string | null = null

  beforeAll(async () => {
    // cleanup previous if any
    await prisma.organizationSettings.deleteMany({ where: { tenantId } }).catch(() => {})
    await prisma.service.deleteMany({ where: { tenantId } }).catch(() => {})

    // seed tenant organization settings with defaultTimezone
    await prisma.organizationSettings.create({ data: { tenantId, name: 'TZ Org', defaultTimezone: 'America/New_York' } })

    // create a service with businessHours (mon-fri 09:00-17:00)
    const svc = await prisma.service.create({ data: {
      name: 'TZ Test Service',
      slug: `tz-test-${Date.now()}`,
      description: 'For TZ test',
      price: 100,
      duration: 60,
      tenantId,
      businessHours: { '1': '09:00-17:00', '2': '09:00-17:00', '3': '09:00-17:00', '4': '09:00-17:00', '5': '09:00-17:00' }
    }})
    serviceId = svc.id
  })

  afterAll(async () => {
    if (serviceId) await prisma.service.deleteMany({ where: { id: serviceId } }).catch(() => {})
    await prisma.organizationSettings.deleteMany({ where: { tenantId } }).catch(() => {})
  })

  it('generates slots within tenant local business hours on DST transition day', async () => {
    if (!serviceId) throw new Error('serviceId missing')
    // DST start in US 2025-03-09
    const from = new Date('2025-03-09T00:00:00Z')
    const to = new Date('2025-03-09T23:59:59Z')

    const res = await getAvailabilityForService({ serviceId, from, to, slotMinutes: 60 })
    const { slots } = res

    expect(Array.isArray(slots)).toBe(true)
    expect(slots.length).toBeGreaterThan(0)

    // Verify every slot, when converted to tenant timezone, falls within 09:00-17:00 local
    for (const s of slots) {
      const startLocal = DateTime.fromISO(s.start).setZone('America/New_York')
      const hour = startLocal.hour
      expect(hour).toBeGreaterThanOrEqual(9)
      expect(hour).toBeLessThan(17)
    }
  })
})
