import prisma from '@/lib/prisma'
import { cleanupTenant } from '@/tests/fixtures/tenantFixtures'

// Mock next-auth getServerSession to return an admin user for auth
vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'test-admin', role: 'ADMIN' } })) }))

describe('Integration: admin org-settings persistence', () => {
  const tenantId = `int-org-settings-${Date.now()}`

  afterEach(async () => {
    try {
      await cleanupTenant(tenantId)
    } catch (e) {}
    vi.restoreAllMocks()
  })

  it('PUT updates organization settings and GET returns persisted values', async () => {
    // Ensure no existing settings
    await prisma.organizationSettings.deleteMany({ where: { tenantId } }).catch(() => {})

    const mod = await import('@/app/api/admin/org-settings/route')

    const payload = {
      general: { name: 'Integration Org', tagline: 'Persisted tagline' },
      contact: { contactEmail: 'hello@example.com' },
      localization: { defaultTimezone: 'UTC', defaultLocale: 'en' },
      branding: { logoUrl: null, legalLinks: { terms: 'https://example.com/terms' } }
    }

    const req = new Request(`https://test.local/api/admin/org-settings`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify(payload),
    })

    const res: any = await mod.PUT(req)
    expect(res.status).toBe(200)
    const out = await res.json()
    expect(out.ok).toBeTruthy()
    expect(out.settings).toBeDefined()
    expect(out.settings.name).toBe('Integration Org')

    // Verify persisted in DB
    const row = await prisma.organizationSettings.findFirst({ where: { tenantId } })
    expect(row).not.toBeNull()
    expect(row?.name).toBe('Integration Org')
    expect(row?.contactEmail).toBe('hello@example.com')

    // Call GET admin route to ensure it returns the persisted shape
    const getReq = new Request(`https://test.local/api/admin/org-settings`, { headers: { 'x-tenant-id': tenantId } })
    const getRes: any = await mod.GET(getReq)
    expect(getRes.status).toBe(200)
    const getOut = await getRes.json()
    expect(getOut.general).toBeDefined()
    expect(getOut.general.name).toBe('Integration Org')
  })
})
