vi.mock('@/lib/prisma', () => ({
  default: {
    service: {
      findUnique: vi.fn(async ({ where }: any) => ({ id: where.id, name: 'Svc', slug: 'svc', active: true, bookingEnabled: true, duration: 60, price: 100 })),
    },
    booking: {
      findMany: vi.fn(async () => ([])),
    },
  },
}))

const pricingMock = {
  calculateServicePrice: vi.fn(async ({ options }: any) => {
    const currency = options?.currency || 'USD'
    const code = (options?.promoCode || '').toUpperCase()
    const base = 10000
    let total = base
    if (code === 'WELCOME10') total = 9000
    if (code === 'SAVE15') total = 8500
    return { currency, baseCents: base, components: [], subtotalCents: base, totalCents: total }
  })
}
vi.mock('@/lib/booking/pricing', () => pricingMock)


describe('/api/bookings/availability includePrice & promo', () => {
  const future = '2099-01-06T00:00:00.000Z' // Monday

  beforeEach(() => {
    pricingMock.calculateServicePrice.mockClear()
  })

  it('returns price in base currency without promo', async () => {
    const { GET }: any = await import('@/app/api/bookings/availability/route')
    const url = new URL('https://x/api/bookings/availability')
    url.searchParams.set('serviceId', 'svc1')
    url.searchParams.set('date', future)
    url.searchParams.set('days', '1')
    url.searchParams.set('includePrice', '1')

    const res: any = await GET({ url: url.toString() } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    const day = json.availability?.[0]
    expect(day).toBeTruthy()
    const slot = day.slots?.[0]
    expect(slot.currency).toBe('USD')
    expect(typeof slot.priceCents).toBe('number')
    expect(slot.priceCents).toBe(10000)
  })

  it('applies WELCOME10 promo', async () => {
    const { GET }: any = await import('@/app/api/bookings/availability/route')
    const url = new URL('https://x/api/bookings/availability')
    url.searchParams.set('serviceId', 'svc1')
    url.searchParams.set('date', future)
    url.searchParams.set('days', '1')
    url.searchParams.set('includePrice', 'true')
    url.searchParams.set('promoCode', 'WELCOME10')

    const res: any = await GET({ url: url.toString() } as any)
    const json = await res.json()
    const slot = json.availability?.[0]?.slots?.[0]
    expect(slot.priceCents).toBe(9000)
    expect(slot.currency).toBe('USD')
  })

  it('applies SAVE15 promo with currency override (EUR)', async () => {
    const { GET }: any = await import('@/app/api/bookings/availability/route')
    const url = new URL('https://x/api/bookings/availability')
    url.searchParams.set('serviceId', 'svc1')
    url.searchParams.set('date', future)
    url.searchParams.set('days', '1')
    url.searchParams.set('includePrice', '1')
    url.searchParams.set('promoCode', 'SAVE15')
    url.searchParams.set('currency', 'EUR')

    const res: any = await GET({ url: url.toString() } as any)
    const json = await res.json()
    const slot = json.availability?.[0]?.slots?.[0]
    expect(slot.priceCents).toBe(8500)
    expect(slot.currency).toBe('EUR')
  })
})
