import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as pricing from '@/lib/booking/pricing'

// Mock prisma used by pricing module
vi.mock('@/lib/prisma', () => {
  return {
    default: {
      service: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where?.id === 'svc-1') return { id: 'svc-1', active: true, duration: 60, price: 100, basePrice: 100 }
          return null
        }),
      },
      exchangeRate: {
        findFirst: vi.fn(async () => ({ base: 'USD', target: 'EUR', rate: 2 })),
      },
    },
  }
})

function mkDate(y: number, m: number, d: number, h = 10) {
  return new Date(y, m - 1, d, h, 0, 0, 0)
}

describe('calculateServicePrice', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('applies weekend surcharge and peak surcharge', async () => {
    const sat = mkDate(2025, 1, 4, 10) // Saturday at 10
    const res = await pricing.calculateServicePrice({ serviceId: 'svc-1', scheduledAt: sat, options: { weekendSurchargePercent: 0.2, peakHours: [{ startHour: 9, endHour: 12 }], peakSurchargePercent: 0.1 } })
    // base $100 -> 10000 cents; weekend +20% = 2000; peak +10% = 1000
    expect(res.baseCents).toBe(10000)
    const codes = res.components.map(c => c.code)
    expect(codes).toContain('WEEKEND')
    expect(codes).toContain('PEAK')
    expect(res.totalCents).toBe(10000 + 2000 + 1000)
  })

  it('applies emergency surcharge and duration overage', async () => {
    const mon = mkDate(2025, 1, 6, 13)
    const res = await pricing.calculateServicePrice({ serviceId: 'svc-1', scheduledAt: mon, durationMinutes: 90, options: { emergencySurchargePercent: 0.25 } })
    // base 10000; overage 30/60 of base = 5000; emergency 25% of base = 2500
    const overage = 5000
    const emergency = 2500
    expect(res.components.find(c => c.code === 'OVERAGE')?.amountCents).toBe(overage)
    expect(res.components.find(c => c.code === 'EMERGENCY')?.amountCents).toBe(emergency)
    expect(res.totalCents).toBe(10000 + overage + emergency)
  })

  it('converts currency when target differs', async () => {
    const mon = mkDate(2025, 1, 6, 9)
    const res = await pricing.calculateServicePrice({ serviceId: 'svc-1', scheduledAt: mon, options: { currency: 'EUR' } })
    // rate mocked as 2 -> amounts doubled
    expect(res.currency).toBe('EUR')
    expect(res.baseCents).toBe(20000)
  })

  it('supports promo resolver returning discount', async () => {
    const mon = mkDate(2025, 1, 6, 9)
    const res = await pricing.calculateServicePrice({ serviceId: 'svc-1', scheduledAt: mon, options: { promoCode: 'SAVE10', promoResolver: async () => ({ code: 'PROMO', label: 'Promo', amountCents: -1000 }) } })
    expect(res.components.find(c => c.code === 'PROMO')?.amountCents).toBe(-1000)
    expect(res.totalCents).toBe(10000 - 1000)
  })
})
