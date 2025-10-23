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

test.describe('Admin Localization - Language Management', () => {
  test('Page loads with Languages tab active', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')
    await expect(page.getByText('Localization & Language Control')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Languages & Availability' })).toHaveAttribute('data-active', 'true')
  })

  test('Can view available languages', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Check that at least the default languages are visible
    await expect(page.getByText(/English|en/i)).toBeVisible()
    await expect(page.getByText(/Arabic|ar/i)).toBeVisible()
    await expect(page.getByText(/Hindi|hi/i)).toBeVisible()

    // Verify table structure
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Language' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible()
  })

  test('Can add a new language', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Open add language form
    await page.getByRole('button', { name: /Add Language/i }).click()
    await expect(page.getByText('Add New Language')).toBeVisible()

    // Fill form
    await page.getByLabel('Language Code').fill('fr')
    await page.getByLabel('Language Name').fill('French')
    await page.getByLabel('Native Name').fill('Français')
    await page.getByLabel('BCP47 Locale').fill('fr-FR')

    // Submit
    const createPromise = page.waitForResponse((r) => r.url().includes('/api/admin/languages') && r.status() === 201)
    await page.getByRole('button', { name: /Add Language$/i }).click()
    await createPromise

    // Verify success notification
    await expect(page.getByText(/Language added successfully|French/i)).toBeVisible()

    // Modal closes
    await expect(page.getByText('Add New Language')).toHaveCount(0)
  })

  test('Can toggle language status', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Find Arabic language row
    const arabicRow = page.getByRole('row').filter({ hasText: 'Arabic' })
    await expect(arabicRow).toBeVisible()

    // Find and click the enable/disable toggle in the row
    const toggleButton = arabicRow.locator('button').filter({ hasText: /Enable|Disable|Check|X/ }).first()
    
    // Click toggle
    const togglePromise = page.waitForResponse((r) => r.url().includes('/api/admin/languages') && r.ok())
    await toggleButton.click()
    await togglePromise

    // Verify feedback
    await expect(page.getByText(/toggled|updated/i)).toBeVisible({ timeout: 5000 })
  })

  test('Can mark a language as featured', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Find Hindi language row
    const hindiRow = page.getByRole('row').filter({ hasText: /Hindi|hi/ })
    await expect(hindiRow).toBeVisible()

    // Find star icon or feature toggle button
    const featureButton = hindiRow.locator('button[title*="Feature"], button[aria-label*="featured"]').first()
    
    if (await featureButton.isVisible()) {
      const updatePromise = page.waitForResponse((r) => r.url().includes('/api/admin/languages') && r.ok())
      await featureButton.click()
      await updatePromise

      await expect(page.getByText(/Language updated|featured/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('Cannot delete English language', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Find English language row
    const englishRow = page.getByRole('row').filter({ hasText: /English|en/ })
    await expect(englishRow).toBeVisible()

    // Find delete button
    const deleteButton = englishRow.locator('button').filter({ hasText: /Delete|Trash/ }).first()
    
    // Delete button should be disabled or not visible
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeDisabled()
    }
  })

  test('Language management shows helpful tips', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Check for tips card
    await expect(page.getByText('Language Management Tips')).toBeVisible()
    await expect(page.getByText(/2-letter ISO 639-1 codes/i)).toBeVisible()
    await expect(page.getByText(/BCP47 locale/i)).toBeVisible()
  })

  test('Can navigate between tabs', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Click Organization Settings tab
    await page.getByRole('tab', { name: 'Organization Settings' }).click()
    await expect(page.getByText('Default Language Settings')).toBeVisible()

    // Click User Language Control tab
    await page.getByRole('tab', { name: 'User Language Control' }).click()
    await expect(page.getByText('User Language Preferences')).toBeVisible()

    // Click Regional Formats tab
    await page.getByRole('tab', { name: 'Regional Formats' }).click()
    await expect(page.getByText(/Regional Format/i)).toBeVisible()

    // Return to Languages tab
    await page.getByRole('tab', { name: 'Languages & Availability' }).click()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('Displays analytics data when available', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Navigate to Analytics tab
    await page.getByRole('tab', { name: 'Analytics' }).click()
    
    // Should see analytics section
    await expect(page.getByText('User Language Distribution')).toBeVisible()

    // Check for metric cards (they might be loading)
    await expect(page.getByText('Total Users')).toBeVisible()
    await expect(page.getByText('Languages in Use')).toBeVisible()
  })

  test('Key Discovery audit button is visible', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization')

    // Navigate to Discovery tab
    await page.getByRole('tab', { name: 'Key Discovery' }).click()

    // Check for audit section
    await expect(page.getByText('Translation Key Discovery')).toBeVisible()
    await expect(page.getByText(/Automated Key Discovery/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Run Discovery Audit/i })).toBeVisible()
  })
})
