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

test.describe('Favorites E2E', () => {
  test('Pin a setting and see it in the overview; unpin it from manage dialog', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    // Navigate to Organization Settings and pin it
    await page.goto('/admin/settings/company')

    // Wait for the FavoriteToggle button and click to pin
    const pinBtn = page.getByRole('button', { name: /Pin setting/i })
    await expect(pinBtn).toBeVisible({ timeout: 5000 })

    const addPromise = page.waitForResponse((r) => r.url().endsWith('/api/admin/settings/favorites') && r.request().method() === 'POST' && r.ok())
    await pinBtn.click()
    await addPromise

    // Go to settings overview and ensure pinned item shows
    await page.goto('/admin/settings')
    const orgLink = page.getByRole('link', { name: 'Organization Settings' })
    await expect(orgLink).toBeVisible({ timeout: 5000 })

    // Reload to confirm persistence
    await page.reload()
    await expect(orgLink).toBeVisible({ timeout: 5000 })

    // Open Manage pinned settings and unpin
    await page.getByRole('button', { name: 'Manage pinned settings' }).click()
    const unpinBtn = page.getByRole('button', { name: `Unpin Organization Settings` })
    await expect(unpinBtn).toBeVisible({ timeout: 5000 })

    const delPromise = page.waitForResponse((r) => r.url().includes('/api/admin/settings/favorites') && r.request().method() === 'DELETE' && r.ok())
    await unpinBtn.click()
    await delPromise

    // Close dialog and verify it's removed from overview
    await page.getByRole('button', { name: 'Close manage pinned settings' }).click()
    await expect(page.getByRole('link', { name: 'Organization Settings' })).toHaveCount(0)
  })
})
