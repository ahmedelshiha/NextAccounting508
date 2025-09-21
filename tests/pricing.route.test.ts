import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, name: 'Svc', slug: 'svc', active: true, duration: 60, price: 100 })),
    },
  },
}))

describe('pricing route', () => {
  it('returns breakdown and totals', async () => {
    const { POST }: any = await import('@/app/api/pricing/route')
    const res: any = await POST(new Request('https://x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      serviceId: 'svc1',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      currency: 'USD',
      promoCode: 'WELCOME10'
    }) }))
    expect(res.status).toBeLessThan(500)
    const json = await res.json()
    const data = json.data || json
    expect(typeof data.totalCents).toBe('number')
    expect(typeof data.baseCents).toBe('number')
    expect(Array.isArray(data.components)).toBe(true)
  })
})
