import { test, expect } from '@playwright/test'

async function devLoginAndSetCookie(page: any, request: any, baseURL: string | undefined, email: string) {
  const base = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'
  const res = await request.post(`${base}/api/dev-login`, { data: { email } })
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  const token = json.token as string
  const url = new URL(base)
  await page.context().addCookies([
    { name: '__Secure-next-auth.session-token', value: token, domain: url.hostname, path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ])
}

test.describe('Admin Communication Settings', () => {
  test('Export and Import flow works', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/communication')
    await expect(page.getByText('Communication Settings')).toBeVisible()

    // Export
    const exportPromise = page.waitForResponse((r) => r.url().endsWith('/api/admin/communication-settings/export') && r.ok())
    await page.getByRole('button', { name: 'Export' }).click()
    await exportPromise

    // Open Import modal
    await page.getByRole('button', { name: 'Import' }).click()
    await expect(page.getByText('Import Communication Settings')).toBeVisible()

    // Prepare a valid import bundle (schema defaults will fill in)
    const payload = { version: '1.0.0', category: 'communication', data: {} }
    const buffer = Buffer.from(JSON.stringify(payload))
    const fileInput = page.locator('input[type="file"][accept="application/json"]')
    await fileInput.setInputFiles({ name: 'communication-import.json', mimeType: 'application/json', buffer })

    // Confirm Import and wait for POST
    const importPromise = page.waitForResponse((r) => r.url().endsWith('/api/admin/communication-settings/import') && r.ok())
    await page.getByRole('button', { name: /^Import$/ }).click()
    await importPromise

    // Modal closes after successful import
    await expect(page.getByText('Import Communication Settings')).toHaveCount(0)
  })
})
