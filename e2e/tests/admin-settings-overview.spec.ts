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

test.describe('Admin Settings Overview', () => {
  test('Overview renders and quick actions work', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings')
    await expect(page.getByText('Settings Overview')).toBeVisible()

    // Run Diagnostics
    const diagPromise = page.waitForResponse((r) => r.url().endsWith('/api/admin/settings/diagnostics') && r.request().method() === 'POST' && r.ok())
    await page.getByRole('button', { name: /Run Diagnostics/i }).click()
    await diagPromise

    // Export
    const exportPromise = page.waitForResponse((r) => r.url().endsWith('/api/admin/settings/export') && r.request().method() === 'GET' && r.ok())
    await page.getByRole('button', { name: 'Export' }).click()
    await exportPromise

    // Import: open file input and upload
    const payload = { exportedAt: new Date().toISOString(), env: {} }
    const buffer = Buffer.from(JSON.stringify(payload))
    const fileInput = page.locator('input[type="file"][accept="application/json"]')
    // Trigger import flow
    await page.getByRole('button', { name: 'Import' }).click()
    await fileInput.setInputFiles({ name: 'settings-import.json', mimeType: 'application/json', buffer })

    const importPromise = page.waitForResponse((r) => r.url().endsWith('/api/admin/settings/import') && r.request().method() === 'POST' && r.ok())
    // Confirm Import action (if there's a confirm button labeled Import)
    const confirmBtn = page.getByRole('button', { name: /^Import$/ })
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click()
    }
    await importPromise
  })

  test('Non-admin users are redirected from /admin/settings', async ({ page, request, baseURL }) => {
    // login as portal user
    await devLoginAndSetCookie(page, request, baseURL, 'user@accountingfirm.com')
    await page.goto('/admin/settings')
    // should redirect to /portal or /login; assert not showing Settings Overview
    await expect(page.locator('text=Settings Overview')).toHaveCount(0)
  })
})
