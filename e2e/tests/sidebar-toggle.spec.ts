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

test.describe('Admin Sidebar Toggle (E2E)', () => {
  test('collapse, expand, and persist across reloads', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    const base = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)

    // Ensure collapse button is present and collapse
    const collapseButton = page.getByLabel('Collapse sidebar')
    await expect(collapseButton).toBeVisible()
    await collapseButton.click()

    // After collapse, expect expand control visible
    const expandButton = page.getByLabel('Expand sidebar')
    await expect(expandButton).toBeVisible()

    // Reload page, ensure collapsed state persisted
    await page.reload()
    await page.waitForLoadState('networkidle')

    // After reload, expand button should still be visible
    await expect(page.getByLabel('Expand sidebar')).toBeVisible()

    // Expand back
    await page.getByLabel('Expand sidebar').click()
    await expect(page.getByLabel('Collapse sidebar')).toBeVisible()
  })
})
