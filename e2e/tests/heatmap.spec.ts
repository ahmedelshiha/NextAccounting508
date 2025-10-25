import { test, expect } from '@playwright/test'

test.describe('Localization Heatmap UI', () => {
  test('renders heatmap tab and filters', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/admin/settings/localization?tab=heatmap`)

    // Ensure header exists
    await expect(page.locator('text=Language Activity Heatmap')).toBeVisible()

    // Wait for possible loading state to finish
    await page.locator('text=Loading activity heatmap...').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})

    // Check for filter controls and export button
    await expect(page.locator('select[aria-label="Select languages to include"]')).toBeVisible()
    await expect(page.locator('select[aria-label="Device filter"]')).toBeVisible()
    await expect(page.locator('select[aria-label="Region filter"]')).toBeVisible()
    await expect(page.locator('button[aria-label="Export heatmap to CSV"]')).toBeVisible()

    // Click 7d/14d/30d and ensure aria-pressed toggles
    const btn7 = page.locator('button', { hasText: '7d' })
    const btn14 = page.locator('button', { hasText: '14d' })
    await btn14.click()
    await expect(btn14).toHaveAttribute('aria-pressed', 'true')
    await btn7.click()
    await expect(btn7).toHaveAttribute('aria-pressed', 'true')

    // If heatmap grid exists, ensure at least one cell has aria-label
    const cells = page.locator('button[aria-label*="sessions"]')
    await expect(cells.first().orNull()).resolves.not.toBeNull()
  })
})
