vi.mock('@/lib/tenant', () => ({ getTenantFromRequest: () => null }))

const base = 'https://t1.example.com'

describe('admin settings services API - RBAC & validation', () => {
  it('POST returns 403 without SERVICES_EDIT', async () => {
    vi.doMock('@/lib/permissions', () => ({ hasPermission: (role: any, p: string) => p !== 'services.edit', PERMISSIONS: { SERVICES_VIEW: 'services.view', SERVICES_EDIT: 'services.edit' } }))
    const mod = await import('@/app/api/admin/settings/services/route')
    const payload = { defaultCurrency: 'USD' }
    const res: any = await mod.POST(new Request(`${base}/api/admin/settings/services`, { method: 'POST', body: JSON.stringify(payload) }))
    expect(res.status).toBe(403)
  })

  it('POST returns 400 for invalid payload', async () => {
    // default auth/permissions mock from setup grants ADMIN rights
    const mod = await import('@/app/api/admin/settings/services/route')
    const payload = { defaultCurrency: 'usd', priceRounding: 10 }
    const res: any = await mod.POST(new Request(`${base}/api/admin/settings/services`, { method: 'POST', body: JSON.stringify(payload) }))
    expect([400, 422]).toContain(res.status)
    const json = await res.json()
    expect(json.ok).not.toBe(true)
  })
})
