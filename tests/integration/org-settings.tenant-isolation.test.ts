import prisma from '@/lib/prisma'
vi.doMock('@/lib/auth', () => ({ authOptions: {} }))

describe('Organization settings tenant isolation', () => {
  const tenantA = 'tenant-a'
  const tenantB = 'tenant-b'
  beforeEach(async () => {
    // reset mock DB
    await prisma.organizationSettings.deleteMany({}).catch(() => {})
    await prisma.organizationSettings.create({ data: { tenantId: tenantA, name: 'Tenant A Org', defaultCurrency: 'EUR' } }).catch(() => {})
  })
  afterEach(async () => {
    await prisma.organizationSettings.deleteMany({}).catch(() => {})
    vi.restoreAllMocks()
  })

  it('GET admin route respects x-tenant-id header', async () => {
    const mod = await import('@/app/api/admin/org-settings/route')
    // Mock server session to have permission
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'ADMIN' } })) }))

    const reqA = new Request('https://test.local/api/admin/org-settings', { headers: { 'x-tenant-id': tenantA } })
    const resA: any = await mod.GET(reqA)
    expect(resA.status).toBe(200)
    const outA = await resA.json()
    expect(outA.localization?.defaultCurrency).toBe('EUR')

    const reqB = new Request('https://test.local/api/admin/org-settings', { headers: { 'x-tenant-id': tenantB } })
    const resB: any = await mod.GET(reqB)
    expect(resB.status).toBe(200)
    const outB = await resB.json()
    // tenantB has no settings -> defaults
    expect(outB.localization?.defaultCurrency).toBe('USD')
  })
})
