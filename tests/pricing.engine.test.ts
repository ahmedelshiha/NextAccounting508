import { describe, it, expect } from 'vitest'
import { calculateServicePrice } from '@/lib/booking/pricing'

// Mock prisma service + exchange rates
const db: any = {
  service: { id: 'svc1', active: true, basePrice: 200, price: 200, duration: 60 },
  rates: [] as any[],
}

vi.mock('@/lib/prisma', () => ({
  default: {
    service: { findUnique: vi.fn(async ({ where }: any) => (where.id === 'svc1' ? db.service : null)) },
    exchangeRate: { findFirst: vi.fn(async () => db.rates[0] || null) },
  },
}))

vi.stubEnv('EXCHANGE_BASE_CURRENCY', 'USD')

describe('PricingEngine', () => {
  it('computes base price with no modifiers', async () => {
    const res = await calculateServicePrice({ serviceId: 'svc1', scheduledAt: new Date('2025-01-07T09:00:00Z') })
    expect(res.currency).toBe('USD')
    expect(res.baseCents).toBe(20000)
    expect(res.totalCents).toBe(20000)
  })

  it('adds weekend surcharge', async () => {
    const res = await calculateServicePrice({ serviceId: 'svc1', scheduledAt: new Date('2025-01-11T09:00:00Z'), options: { weekendSurchargePercent: 0.15 } })
    // 200 + 15% = 230
    expect(res.totalCents).toBe(23000)
  })

  it('adds peak surcharge within peak hours', async () => {
    const res = await calculateServicePrice({ serviceId: 'svc1', scheduledAt: new Date('2025-01-07T10:30:00Z'), options: { peakHours: [{ startHour: 10, endHour: 12 }], peakSurchargePercent: 0.1 } })
    // 200 + 10% = 220
    expect(res.totalCents).toBe(22000)
  })

  it('adds duration overage pro-rata', async () => {
    const res = await calculateServicePrice({ serviceId: 'svc1', scheduledAt: new Date('2025-01-07T09:00:00Z'), durationMinutes: 90 })
    // base 200 + overage 30min at 200/60 = 3.333.. per min => ~100 more cents
    expect(res.totalCents).toBe(30000)
  })

  it('applies promo discount via resolver', async () => {
    const res = await calculateServicePrice({ serviceId: 'svc1', scheduledAt: new Date('2025-01-07T09:00:00Z'), options: { promoCode: 'FIRST10', promoResolver: (code) => code === 'FIRST10' ? { code: 'PROMO', label: 'Promo 10%', amountCents: -2000 } : null } })
    expect(res.totalCents).toBe(18000)
  })

  it('converts currency when target differs', async () => {
    db.rates = [{ base: 'USD', target: 'AED', rate: 3.67, fetchedAt: new Date() }]
    const res = await calculateServicePrice({ serviceId: 'svc1', scheduledAt: new Date('2025-01-07T09:00:00Z'), options: { currency: 'AED' } })
    expect(res.currency).toBe('AED')
    expect(res.baseCents).toBeGreaterThan(0)
    expect(res.totalCents).toBeGreaterThan(res.baseCents - 1)
  })
})
