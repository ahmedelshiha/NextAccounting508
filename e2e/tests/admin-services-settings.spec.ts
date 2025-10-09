import { test, expect } from '@playwright/test'

async function devLoginAndSetCookie(page: any, request: any, baseURL: string | undefined, email: string) {
  const base = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'
  const res = await request.post(`${base}/api/_dev/login`, { data: { email } })
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  const token = json.token as string
  const url = new URL(base)
  await page.context().addCookies([
    { name: '__Secure-next-auth.session-token', value: token, domain: url.hostname, path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ])
}

test.describe('Admin Services Settings (E2E)', () => {
  test('Save allowCloning setting and observe clone behavior', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    const base = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'

    // 1) Create a service via API to use as clone source
    const unique = Date.now()
    const name = `E2E Service ${unique}`
    const slug = `e2e-service-${unique}`
    const createRes = await request.post(`${base}/api/admin/services`, {
      data: {
        name,
        slug,
        description: 'E2E test service for settings tests',
        features: [],
        price: 100,
        duration: 60,
        featured: false,
        active: true,
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const createJson = await createRes.json()
    const serviceId = createJson?.service?.id
    expect(serviceId).toBeTruthy()

    // 2) Open settings page and disable cloning via UI
    await page.goto('/admin/settings/services')
    await expect(page.getByText('Service Management')).toBeVisible()

    // Ensure the Allow cloning toggle exists and uncheck it
    const toggle = page.getByLabel('Allow cloning of services')
    if (await toggle.count() === 0) {
      // fallback: look for text and click nearby
      await page.getByText('Allow cloning of services').first().click()
    } else {
      const isChecked = await toggle.isChecked().catch(() => false)
      if (isChecked) await toggle.click()
    }

    // Save settings and wait for API
    const savePromise = page.waitForResponse((r) => r.url().endsWith('/api/admin/settings/services') && r.request().method() === 'POST')
    await page.getByRole('button', { name: /Save settings/i }).click()
    await savePromise

    // 3) Attempt to clone the service - expect forbidden
    const cloneResDisabled = await request.post(`${base}/api/admin/services/${serviceId}/clone`, { data: {} })
    expect(cloneResDisabled.status()).toBeGreaterThanOrEqual(400)

    // 4) Re-enable cloning via UI
    await page.goto('/admin/settings/services')
    const toggle2 = page.getByLabel('Allow cloning of services')
    if (await toggle2.count() === 0) {
      await page.getByText('Allow cloning of services').first().click()
    } else {
      const isChecked2 = await toggle2.isChecked().catch(() => false)
      if (!isChecked2) await toggle2.click()
    }
    const savePromise2 = page.waitForResponse((r) => r.url().endsWith('/api/admin/settings/services') && r.request().method() === 'POST')
    await page.getByRole('button', { name: /Save settings/i }).click()
    await savePromise2

    // 5) Attempt to clone again - expect success
    const cloneRes = await request.post(`${base}/api/admin/services/${serviceId}/clone`, { data: {} })
    expect([200,201,202].includes(cloneRes.status())).toBeTruthy()
    const cloneJson = await cloneRes.json()
    const clonedId = cloneJson?.service?.id

    // Cleanup: delete created clones and original
    if (clonedId) {
      const delC = await request.delete(`${base}/api/admin/services/${clonedId}`)
      // allow either success or permission error depending on role mapping
      if (!delC.ok()) console.warn('Failed to delete cloned service', await delC.text().catch(() => ''))
    }

    const delOrig = await request.delete(`${base}/api/admin/services/${serviceId}`)
    if (!delOrig.ok()) console.warn('Failed to delete original service', await delOrig.text().catch(() => ''))
  })
})
