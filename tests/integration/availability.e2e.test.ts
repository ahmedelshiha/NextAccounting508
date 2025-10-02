import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '@/lib/prisma'
import { getAvailabilityForService } from '@/lib/booking/availability'
import { DateTime } from 'luxon'

describe('E2E: getAvailabilityForService respects tenant defaultTimezone', () => {
  const tenantId = 'test-tenant-tz'
  let serviceId: string | null = null

  // register tenant for centralized cleanup
  import('../testSetup').then(mod => mod.registerTenant(tenantId)).catch(() => {})

  beforeAll(async () => {
    const svc = await (await import('../fixtures/tenantFixtures')).seedTenantWithService({ tenantId, timezone: 'America/New_York', serviceName: 'TZ Test Service' })
    serviceId = svc.id
  })

  afterAll(async () => {
    await (await import('../fixtures/tenantFixtures')).cleanupTenant(tenantId)
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
