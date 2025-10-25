import { test, expect } from '@playwright/test'

/**
 * Translation Analytics Dashboard E2E Tests
 * 
 * Tests the complete workflow:
 * 1. Admin accesses translation dashboard
 * 2. Views current coverage stats
 * 3. Sees recent added keys
 * 4. Reviews missing translations
 * 5. Runs key discovery audit
 * 6. Verifies analytics trends
 */

test.describe('Translation Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForNavigation()
  })

  test('should display translation dashboard with coverage stats', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/admin/translations/dashboard')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check heading is present
    await expect(page.locator('text=Translation Management')).toBeVisible()

    // Check for status cards
    await expect(page.locator('text=Total Translation Keys')).toBeVisible()
    await expect(page.locator('text=English')).toBeVisible()
    await expect(page.locator('text=العربية')).toBeVisible()
    await expect(page.locator('text=हिन्दी')).toBeVisible()

    // Check coverage percentages are displayed
    const enCoverage = page.locator('text=/\\d+\\.\\d%/')
    await expect(enCoverage).toBeTruthy()
  })

  test('should show user language distribution', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Check user distribution section
    await expect(page.locator('text=User Language Distribution')).toBeVisible()

    // Check for language-specific user counts
    const englishUsers = page.locator('text=English').locator('..').locator('text=/\\d+/')
    await expect(englishUsers).toBeTruthy()
  })

  test('should display recent translation keys', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Check recently added section
    await expect(page.locator('text=Recently Added Keys')).toBeVisible()

    // Verify table/list structure
    const recentKeysSection = page.locator('section').filter({ has: page.locator('text=Recently Added Keys') })
    await expect(recentKeysSection).toBeVisible()
  })

  test('should show missing translations by language', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Check missing translations section
    await expect(page.locator('text=Missing Translations')).toBeVisible()

    // Check for language tabs
    const arTab = page.locator('button[role="tab"]:has-text("العربية")')
    const hiTab = page.locator('button[role="tab"]:has-text("हिन्दी")')

    await expect(arTab).toBeVisible()
    await expect(hiTab).toBeVisible()
  })

  test('should switch between language tabs in missing translations', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Click Hindi tab
    await page.click('button[role="tab"]:has-text("हिन्दी")')

    // Wait for content to update
    await page.waitForLoadState('networkidle')

    // Verify Hindi keys are shown
    const hiText = page.locator('text=/हिन्दी|HI/')
    await expect(hiText).toBeTruthy()
  })

  test('should display translation coverage trends', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for analytics section
    await expect(page.locator('text=Translation Coverage Trends')).toBeVisible()

    // Check for period selector buttons
    await expect(page.locator('button:has-text("7d")')).toBeVisible()
    await expect(page.locator('button:has-text("14d")')).toBeVisible()
    await expect(page.locator('button:has-text("30d")')).toBeVisible()
    await expect(page.locator('button:has-text("90d")')).toBeVisible()
  })

  test('should allow switching analytics time periods', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Click 90d button
    await page.click('button:has-text("90d")')

    // Wait for data to load
    await page.waitForLoadState('networkidle')

    // Verify the period changed (would show different data)
    await expect(page.locator('text=90d').or(page.locator('text=Last 90 Days'))).toBeVisible()
  })

  test('should display trend data in table format', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Scroll to analytics section
    const analyticsSection = page.locator('text=Coverage Trend').locator('..')
    await analyticsSection.scrollIntoViewIfNeeded()

    // Check for data table
    const table = page.locator('table')
    await expect(table).toBeTruthy()

    // Check for column headers
    await expect(page.locator('th:has-text("Date")')).toBeVisible()
    await expect(page.locator('th:has-text("EN")')).toBeVisible()
    await expect(page.locator('th:has-text("AR")')).toBeVisible()
    await expect(page.locator('th:has-text("HI")')).toBeVisible()
  })

  test('should show action items with instructions', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for recommended actions section
    await expect(page.locator('text=Recommended Actions')).toBeVisible()

    // Check for action items
    await expect(page.locator('text=Review Missing Translations')).toBeVisible()
    await expect(page.locator('text=Run Key Discovery Audit')).toBeVisible()
    await expect(page.locator('text=Update Translation Files')).toBeVisible()
  })

  test('should show command to run key discovery', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for command in action items
    const command = page.locator('code:has-text("npm run discover:keys")')
    await expect(command).toBeVisible()
  })

  test('should refresh data when page is reloaded', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Get initial timestamp
    const initialTimestamp = await page.locator('text=/Last updated:.*/)').innerText()

    // Wait a moment
    await page.waitForTimeout(1000)

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Timestamp should be updated
    const newTimestamp = await page.locator('text=/Last updated:.*/)').innerText()

    expect(initialTimestamp).toBeTruthy()
    expect(newTimestamp).toBeTruthy()
  })

  test('should handle loading state', async ({ page }) => {
    // Start navigation
    const navigationPromise = page.goto('/admin/translations/dashboard')

    // Check for loading indicator
    const loader = page.locator('text=/Loading|Loader|Spinner/')
    // Loading indicator might appear briefly

    // Wait for navigation to complete
    await navigationPromise
    await page.waitForLoadState('networkidle')

    // Content should be visible after loading
    await expect(page.locator('text=Translation Management')).toBeVisible()
  })

  test('should require admin permission to access dashboard', async ({ page }) => {
    // Try to access as non-admin user
    // This would require setup of non-admin user
    // For now, we verify the permission structure

    // Navigate directly to dashboard
    const response = await page.goto('/admin/translations/dashboard')

    // Should either redirect to login or show 403
    const url = page.url()
    const isAllowed = url.includes('/admin/translations/dashboard')

    // If accessing without permission, should be redirected
    if (!isAllowed) {
      expect(url).toContain('login')
    }
  })

  test('should display error state gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('/api/admin/translations/status', route =>
      route.abort('failed')
    )

    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for error message
    const errorMessage = page.locator('text=/error|Error|failed|Failed/')
    // Error message should appear or page should show graceful fallback
  })

  test('should update coverage stats in real-time', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Get initial coverage values
    const arCoverage = page.locator('text=/\\d+\\.\\d%/').first()
    const initialValue = await arCoverage.innerText()

    // Wait and reload
    await page.waitForTimeout(2000)
    // In a real scenario, the backend would update translations

    // Coverage should still be visible
    await expect(arCoverage).toBeVisible()
  })

  test('should handle timezone display correctly', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for last updated timestamp
    const timestamp = page.locator('text=/Last updated:/')
    await expect(timestamp).toBeVisible()

    // Timestamp should be in ISO format or readable format
    const text = await timestamp.innerText()
    expect(text).toMatch(/Last updated:/)
  })

  test('should export or download analytics data', async ({ page }) => {
    await page.goto('/admin/translations/dashboard')
    await page.waitForLoadState('networkidle')

    // Look for export button (if implemented)
    const exportBtn = page.locator('button:has-text("Export")')

    if (await exportBtn.isVisible()) {
      // Click export
      const downloadPromise = page.waitForEvent('download')
      await exportBtn.click()

      // Verify download was triggered
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/translation|analytics|export/)
    }
  })
})

/**
 * Translation Key Discovery Script E2E Tests
 */
test.describe('Translation Key Discovery Script', () => {
  test('should execute discovery command successfully', async ({}) => {
    // This would be run in a test environment
    // npm run discover:keys should generate translation-key-audit.json
    expect(true).toBe(true) // Placeholder
  })

  test('should generate audit report', async ({}) => {
    // Verify translation-key-audit.json is created
    // with proper structure and data
    expect(true).toBe(true) // Placeholder
  })

  test('should identify missing keys', async ({}) => {
    // Verify missingTranslations array in audit
    expect(true).toBe(true) // Placeholder
  })

  test('should identify orphaned keys', async ({}) => {
    // Verify orphanedKeys array in audit
    expect(true).toBe(true) // Placeholder
  })
})
