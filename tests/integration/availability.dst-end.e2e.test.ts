import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '@/lib/prisma'
import { getAvailabilityForService } from '@/lib/booking/availability'
import { DateTime } from 'luxon'

describe('E2E: getAvailabilityForService handles DST end (fall-back) without duplicate slots', () => {
  const tenantId = 'test-tenant-tz-fall'
  let serviceId: string | null = null

  beforeAll(async () => {
    await prisma.organizationSettings.deleteMany({ where: { tenantId } }).catch(() => {})
    await prisma.service.deleteMany({ where: { tenantId } }).catch(() => {})

    await prisma.organizationSettings.create({ data: { tenantId, name: 'TZ Fall Org', defaultTimezone: 'America/New_York' } })

    const svc = await prisma.service.create({ data: {
      name: 'TZ Fall Service',
      slug: `tz-fall-${Date.now()}`,
      description: 'For TZ fall test',
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

  it('does not produce duplicate local-start times on DST end day', async () => {
    if (!serviceId) throw new Error('serviceId missing')
    // DST end (fall-back) in US 2025-11-02
    const from = new Date('2025-11-02T00:00:00Z')
    const to = new Date('2025-11-02T23:59:59Z')

    const res = await getAvailabilityForService({ serviceId, from, to, slotMinutes: 60 })
    const { slots } = res

    expect(Array.isArray(slots)).toBe(true)
    expect(slots.length).toBeGreaterThan(0)

    // Convert starts to tenant-local hour:minute strings and check uniqueness
    const localStarts = slots.map(s => DateTime.fromISO(s.start).setZone('America/New_York').toFormat('yyyy-LL-dd HH:mm'))
    const uniques = new Set(localStarts)
    // No duplicate local start times
    expect(uniques.size).toBe(slots.length)

    // All local starts should be within 09:00-16:59 (business hours 9-17)
    for (const t of localStarts) {
      const dt = DateTime.fromFormat(t, 'yyyy-LL-dd HH:mm').setZone('America/New_York')
      const hour = dt.hour
      expect(hour).toBeGreaterThanOrEqual(9)
      expect(hour).toBeLessThan(17)
    }
  })
})
