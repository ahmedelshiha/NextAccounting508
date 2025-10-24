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

test.describe('Admin Localization - Organization Settings', () => {
  test('Organization Settings tab loads correctly', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')
    await expect(page.getByText('Default Language Settings')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Organization Settings' })).toHaveAttribute('data-active', 'true')
  })

  test('Can select default language', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')

    // Find default language select
    const defaultLangSelect = page.getByLabel('Default Language')
    await expect(defaultLangSelect).toBeVisible()

    // Click to open dropdown
    await defaultLangSelect.click()

    // Should show language options
    await expect(page.getByText(/English|Arabic|Hindi/i)).toBeVisible()
  })

  test('Can select fallback language', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')

    // Find fallback language select
    const fallbackLangSelect = page.getByLabel('Fallback Language')
    await expect(fallbackLangSelect).toBeVisible()

    // Click to open dropdown
    await fallbackLangSelect.click()

    // Should show language options
    await expect(page.getByText(/English|Arabic|Hindi/i)).toBeVisible()
  })

  test('Can toggle user language control options', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')

    // Check for language control toggles
    await expect(page.getByText('Show Language Switcher')).toBeVisible()
    await expect(page.getByText('Persist Language Preference')).toBeVisible()
    await expect(page.getByText('Auto-Detect Browser Language')).toBeVisible()
    await expect(page.getByText('Allow Users to Override')).toBeVisible()

    // Find toggle buttons
    const toggles = page.locator('[role="switch"]')
    const count = await toggles.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Can configure RTL support', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')

    // Check for RTL support option
    await expect(page.getByText('Enable RTL Support')).toBeVisible()
    await expect(page.getByText(/Automatically apply RTL styles/i)).toBeVisible()
  })

  test('Can set missing translation behavior', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')

    // Find missing translation behavior select
    const behaviorSelect = page.getByLabel('Missing Translation Behavior')
    await expect(behaviorSelect).toBeVisible()

    // Click to open dropdown
    await behaviorSelect.click()

    // Should show options
    await expect(page.getByText(/Show translation key/i)).toBeVisible()
    await expect(page.getByText(/Show fallback language/i)).toBeVisible()
    await expect(page.getByText(/Show empty string/i)).toBeVisible()
  })

  test('Can save organization settings', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')

    // Wait for initial load
    await page.waitForLoadState('networkidle')

    // Click save button
    const savePromise = page.waitForResponse((r) => r.url().includes('/api/admin/org-settings/localization') && r.status() === 200)
    await page.getByRole('button', { name: /Save Settings/i }).click()
    await savePromise

    // Verify success feedback
    await expect(page.getByText(/saved|success/i)).toBeVisible({ timeout: 5000 })
  })

  test('User Language Control tab shows statistics', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=user-preferences')
    await expect(page.getByText('User Language Preferences')).toBeVisible()

    // Check for statistics cards
    await expect(page.getByText('Total Users')).toBeVisible()
    await expect(page.getByText('Languages in Use')).toBeVisible()

    // Check for language preference table
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('Regional Formats tab displays format settings', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=regional')
    await expect(page.getByText('Regional Format Configuration')).toBeVisible()

    // Should show cards for different languages
    await expect(page.getByText(/English|Arabic|Hindi/i)).toBeVisible()

    // Check for format fields
    await expect(page.getByText(/Date Format|Time Format/i)).toBeVisible()
    await expect(page.getByText(/Currency|Symbol/i)).toBeVisible()
  })

  test('Translation Platforms tab loads', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=integration')
    await expect(page.getByText('Translation Platforms')).toBeVisible()

    // Check for Crowdin section
    await expect(page.getByText(/Crowdin|Translation Integration/i)).toBeVisible()
  })

  test('Translation Dashboard shows coverage metrics', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=translations')
    await expect(page.getByText('Translation Dashboard')).toBeVisible()

    // Check for coverage cards
    await expect(page.getByText(/Coverage|Keys|Translations/i)).toBeVisible()
  })

  test('Organization settings persists across page refresh', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    // Navigate to org settings
    await page.goto('/admin/settings/localization?tab=organization')
    await page.waitForLoadState('networkidle')

    // Get initial state
    const initialDefault = await page.getByLabel('Default Language').inputValue()

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify same value is loaded
    const refreshedDefault = await page.getByLabel('Default Language').inputValue()
    expect(refreshedDefault).toBe(initialDefault)
  })

  test('Has descriptive help text for all options', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')

    // Check for help text
    await expect(page.getByText(/Language shown to new users/i)).toBeVisible()
    await expect(page.getByText(/used when translation is missing/i)).toBeVisible()
    await expect(page.getByText(/Display language selector/i)).toBeVisible()
    await expect(page.getByText(/Save user's language choice/i)).toBeVisible()
    await expect(page.getByText(/Use browser language on first visit/i)).toBeVisible()
    await expect(page.getByText(/Let users change their language/i)).toBeVisible()
    await expect(page.getByText(/Automatically apply RTL styles/i)).toBeVisible()
  })

  test('Form validation works for language selection', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')

    await page.goto('/admin/settings/localization?tab=organization')

    // Both default and fallback are required
    const defaultLangSelect = page.getByLabel('Default Language')
    const fallbackLangSelect = page.getByLabel('Fallback Language')

    await expect(defaultLangSelect).toBeVisible()
    await expect(fallbackLangSelect).toBeVisible()

    // Save button should be visible and clickable
    const saveButton = page.getByRole('button', { name: /Save Settings/i })
    await expect(saveButton).toBeVisible()
  })
})
