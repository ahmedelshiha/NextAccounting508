import { vi, expect, it, describe, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))

// We'll import after mocking
describe('calculateServicePrice tenant default currency', () => {
  let prismaMock: any
  beforeEach(() => {
    prismaMock = {
      service: {
        findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, basePrice: 100, price: 100, duration: 60, tenantId: 't1', active: true }))
      },
      exchangeRate: { findFirst: vi.fn(async () => null) },
      organizationSettings: { findFirst: vi.fn(async ({ where }: any) => ({ defaultCurrency: 'EUR' })) }
    }
    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
  })

  afterEach(() => {
    vi.resetAllMocks()
    try { vi.unmock('@/lib/prisma') } catch {}
  })

  it('uses tenant organization defaultCurrency as baseCurrency when present', async () => {
    const { calculateServicePrice } = await import('@/lib/booking/pricing')
    const out = await calculateServicePrice({ serviceId: 's1', scheduledAt: new Date('2024-01-01T12:00:00Z'), options: {} })
    expect(out.currency).toBe('EUR')
    expect(out.baseCents).toBe(10000)
  })
})
