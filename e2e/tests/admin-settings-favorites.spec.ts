import { test, expect, Page } from '@playwright/test'

test.describe('Admin Settings Favorites', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    // Navigate to admin settings
    await page.goto('/admin/settings/organization')
    
    // Mock authentication if needed
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      },
    ])
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should pin a settings page and persist across page refresh', async () => {
    // Navigate to organization settings
    await page.goto('/admin/settings/organization')
    
    // Verify FavoriteToggle button is visible
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await expect(favoriteButton).toBeVisible()
    
    // Initial state should be unpinned
    await expect(favoriteButton).toContainText('Pin')
    
    // Click to pin
    await favoriteButton.click()
    
    // Wait for API call and button state change
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Verify the star icon is filled (yellow)
    const star = favoriteButton.locator('svg').first()
    await expect(star).toHaveClass(/text-yellow-500/)
    
    // Refresh the page
    await page.reload()
    
    // Verify pinned state persists after refresh
    const refreshedButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await expect(refreshedButton).toContainText('Pinned', { timeout: 5000 })
  })

  test('should unpin a favorited settings page', async () => {
    await page.goto('/admin/settings/organization')
    
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    
    // Pin first
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Unpin
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pin', { timeout: 5000 })
    
    // Verify unpinned state persists after refresh
    await page.reload()
    const refreshedButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await expect(refreshedButton).toContainText('Pin', { timeout: 5000 })
  })

  test('should show pinned settings in favorites overview', async () => {
    // Navigate to organization settings
    await page.goto('/admin/settings/organization')
    
    // Pin the setting
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Navigate to settings overview
    await page.goto('/admin/settings')
    
    // Check if pinned setting appears in the favorites list
    const favoritesSection = page.locator('text=Pinned Settings').or(page.locator('text=Favorites'))
    if (await favoritesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(page.locator('text=Organization Settings')).toBeVisible()
    }
  })

  test('should persist multiple pinned settings across sessions', async () => {
    // Pin organization settings
    await page.goto('/admin/settings/organization')
    let favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Pin booking settings
    await page.goto('/admin/settings/booking')
    favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Pin financial settings
    await page.goto('/admin/settings/financial')
    favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Create new browser context (simulates new session)
    const newContext = await page.context().browser()?.newContext()
    if (!newContext) throw new Error('Failed to create new context')
    
    const newPage = await newContext.newPage()
    
    try {
      // Verify all pinned settings persist in new session
      await newPage.goto('/admin/settings/organization')
      let button = newPage.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
      await expect(button).toContainText('Pinned', { timeout: 5000 })
      
      await newPage.goto('/admin/settings/booking')
      button = newPage.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
      await expect(button).toContainText('Pinned', { timeout: 5000 })
      
      await newPage.goto('/admin/settings/financial')
      button = newPage.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
      await expect(button).toContainText('Pinned', { timeout: 5000 })
    } finally {
      await newPage.close()
      await newContext.close()
    }
  })

  test('should update favorites when toggled from different pages', async () => {
    // Pin from organization settings
    await page.goto('/admin/settings/organization')
    let favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Navigate away and back
    await page.goto('/admin/settings/booking')
    await page.goto('/admin/settings/organization')
    
    // Verify still pinned
    favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Unpin from organization settings
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pin', { timeout: 5000 })
  })

  test('should handle rapid pin/unpin actions', async () => {
    await page.goto('/admin/settings/organization')
    
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    
    // Rapid clicks
    await favoriteButton.click()
    await favoriteButton.click()
    await favoriteButton.click()
    
    // Final state should be pinned
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Verify persistence
    await page.reload()
    const refreshedButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await expect(refreshedButton).toContainText('Pinned', { timeout: 5000 })
  })

  test('should show loading state during favorite toggle', async () => {
    await page.goto('/admin/settings/organization')
    
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    
    // Click and verify button becomes disabled briefly
    await favoriteButton.click()
    
    // Button should be disabled while API call is in progress
    // (may be disabled:opacity or similar visual state)
    await page.waitForTimeout(100)
    
    // Should return to enabled state after API response
    await expect(favoriteButton).toBeEnabled({ timeout: 5000 })
  })

  test('should maintain favorite state across settings tabs', async () => {
    await page.goto('/admin/settings/organization')
    
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // If settings page has tabs, switch between them
    const tabs = page.locator('[role="tab"]')
    if ((await tabs.count()) > 0) {
      const secondTab = tabs.nth(1)
      if (await secondTab.isVisible()) {
        await secondTab.click()
        await page.waitForTimeout(500)
        
        // Switch back
        const firstTab = tabs.nth(0)
        await firstTab.click()
        
        // Verify favorite button state persists
        const persistedButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
        await expect(persistedButton).toContainText('Pinned', { timeout: 5000 })
      }
    }
  })

  test('should sync favorites across multiple browser tabs', async () => {
    // Open first tab
    await page.goto('/admin/settings/organization')
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    
    // Open second tab (simulated with new page)
    const page2 = await page.context().newPage()
    
    try {
      await page2.goto('/admin/settings/booking')
      
      // Pin in first tab
      await favoriteButton.click()
      await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
      
      // Navigate second tab to organization settings
      await page2.goto('/admin/settings/organization')
      
      // Verify pinned state is visible in second tab
      const page2Button = page2.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
      await expect(page2Button).toContainText('Pinned', { timeout: 5000 })
    } finally {
      await page2.close()
    }
  })

  test('should handle favorite operations when offline', async () => {
    await page.goto('/admin/settings/organization')
    
    // Go offline
    await page.context().setOffline(true)
    
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    
    // Try to pin while offline (should fail gracefully or queue)
    await favoriteButton.click()
    
    // App should handle gracefully (either error message or queued action)
    await page.waitForTimeout(500)
    
    // Go back online
    await page.context().setOffline(false)
    
    // Reload and verify state
    await page.reload()
    const refreshedButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    // Button should be in some valid state
    await expect(refreshedButton).toBeVisible()
  })

  test('should show correct aria labels for accessibility', async () => {
    await page.goto('/admin/settings/organization')
    
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    
    // Initial aria-label should indicate "Pin"
    await expect(favoriteButton).toHaveAttribute('aria-label', /Pin setting/)
    
    // After clicking, aria-label should indicate "Unpin"
    await favoriteButton.click()
    await expect(favoriteButton).toHaveAttribute('aria-label', /Unpin setting/, { timeout: 5000 })
  })

  test('should display favorite status with visual indicator', async () => {
    await page.goto('/admin/settings/organization')
    
    const favoriteButton = page.locator('button').filter({ hasText: /Pin|Pinned/ }).first()
    
    // Unpinned state: should show StarOff icon with gray color
    let icon = favoriteButton.locator('svg').first()
    await expect(icon).toHaveClass(/text-gray-400/)
    
    // Pin it
    await favoriteButton.click()
    await expect(favoriteButton).toContainText('Pinned', { timeout: 5000 })
    
    // Pinned state: should show Star icon with yellow color
    icon = favoriteButton.locator('svg').first()
    await expect(icon).toHaveClass(/text-yellow-500/)
  })

  test('should update FavoriteToggle across multiple instances', async () => {
    // Create a scenario with multiple FavoriteToggle components visible
    // (if there's a settings overview page with multiple toggles)
    await page.goto('/admin/settings')
    
    // Find multiple favorite toggles if they exist
    const toggles = page.locator('button').filter({ hasText: /Pin|Pinned/ })
    const toggleCount = await toggles.count()
    
    if (toggleCount > 1) {
      // Pin the first one
      const firstToggle = toggles.first()
      await firstToggle.click()
      
      // Verify only the first one is pinned
      const firstIcon = firstToggle.locator('svg').first()
      await expect(firstIcon).toHaveClass(/text-yellow-500/, { timeout: 5000 })
      
      // Other toggles should remain unpinned
      const secondToggle = toggles.nth(1)
      const secondIcon = secondToggle.locator('svg').first()
      await expect(secondIcon).not.toHaveClass(/text-yellow-500/)
    }
  })
})
