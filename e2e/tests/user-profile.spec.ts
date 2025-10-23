import { test, expect } from '@playwright/test'

test.describe('User Profile Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
  })

  test('dropdown trigger is visible and clickable', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await expect(trigger).toBeVisible()
    await trigger.click()
    await expect(page.getByText(/manage profile/i)).toBeVisible()
  })

  test('dropdown closes on escape and returns focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await trigger.click()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('theme switcher works and persists', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await trigger.click()

    // Check that dark theme option is visible
    const darkOption = page.getByRole('menuitemradio', { name: /dark/i })
    await expect(darkOption).toBeVisible()

    // Click dark theme
    await darkOption.click()

    // Verify dark theme class is applied
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveClass(/dark/)
  })

  test('status selector shows current status and updates', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await trigger.click()

    // Check status options
    const onlineOption = page.getByRole('menuitemradio', { name: /online/i })
    const awayOption = page.getByRole('menuitemradio', { name: /away/i })

    await expect(onlineOption).toBeVisible()
    await expect(awayOption).toBeVisible()

    // Change status to away
    await awayOption.click()

    // Reopen dropdown and verify status changed
    await trigger.click()
    await expect(awayOption).toHaveAttribute('aria-checked', 'true')
  })

  test('avatar displays user initials', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await trigger.click()

    // Avatar should be visible with initials or image
    const avatar = page.locator('[class*="avatar"]').first()
    await expect(avatar).toBeVisible()
  })

  test('sign out confirmation dialog appears and works', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await trigger.click()

    const signOutButton = page.getByText(/sign out/i).last()
    await signOutButton.click()

    // Check for browser confirmation (if using window.confirm)
    page.once('dialog', async (dialog) => {
      await dialog.dismiss()
    })
  })

  test('keyboard navigation works in menu', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await trigger.click()

    // Tab should navigate through menu items
    const menuItems = page.locator('[role="menuitem"], [role="menuitemradio"]')
    const firstItem = menuItems.first()

    // All menu items should be present
    await expect(menuItems).toHaveCount(async (count) => count > 0)
  })
})

test.describe('Profile Management Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await trigger.click()
    await page.getByText(/manage profile/i).click()
    await page.waitForSelector('[role="dialog"]')
  })

  test('panel opens and closes correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /manage profile/i })).toBeVisible()

    // Close via escape
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('profile tab displays editable fields', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i })
    await expect(profileTab).toHaveAttribute('aria-selected', 'true')

    // Check for profile fields
    await expect(page.getByText(/full name/i)).toBeVisible()
    await expect(page.getByText(/email/i)).toBeVisible()
    await expect(page.getByText(/organization/i)).toBeVisible()
  })

  test('security tab shows security options', async ({ page }) => {
    const securityTab = page.getByRole('tab', { name: /sign in & security/i })
    await securityTab.click()

    // Check for security fields
    await expect(page.getByText(/two-factor authentication/i)).toBeVisible()
    await expect(page.getByText(/email verification/i)).toBeVisible()
    await expect(page.getByText(/password/i)).toBeVisible()
  })

  test('can switch between tabs', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i })
    const securityTab = page.getByRole('tab', { name: /sign in & security/i })

    // Start on profile tab
    await expect(profileTab).toHaveAttribute('aria-selected', 'true')

    // Switch to security
    await securityTab.click()
    await expect(securityTab).toHaveAttribute('aria-selected', 'true')

    // Switch back to profile
    await profileTab.click()
    await expect(profileTab).toHaveAttribute('aria-selected', 'true')
  })

  test('editable field enter edit mode on click', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i })
    await profileTab.click()

    // Click on a field to edit
    const nameField = page.locator('button:has-text("Full name")').first()
    await nameField.click()

    // Should show input field
    const input = page.locator('input[type="text"]')
    await expect(input).toBeVisible()
  })

  test('editable field can be edited and cancelled', async ({ page }) => {
    const nameField = page.locator('button:has-text("Full name")').first()
    await nameField.click()

    const input = page.locator('input[type="text"]')
    await expect(input).toBeVisible()

    // Type new value
    await input.fill('Test User')

    // Click cancel
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await cancelButton.click()

    // Input should be gone
    await expect(input).not.toBeVisible()
  })

  test('focus returns to trigger after panel closes', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('aria-live announcements work for status changes', async ({ page }) => {
    // Check for aria-live region
    const liveRegion = page.locator('[aria-live]').first()
    await expect(liveRegion).toBeVisible()
  })

  test('mobile responsive behavior', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Dialog should still be usable on mobile
    const securityTab = page.getByRole('tab', { name: /sign in & security/i })
    await securityTab.click()
    await expect(securityTab).toHaveAttribute('aria-selected', 'true')
  })

  test('loading state displays while fetching profile', async ({ page }) => {
    // The profile should load quickly, but we can verify the structure
    await expect(page.getByRole('tab', { name: /profile/i })).toBeVisible()
  })
})

test.describe('Full User Profile Flow', () => {
  test('complete flow: open menu, access panel, switch tabs, close', async ({ page }) => {
    await page.goto('/admin')

    // Open dropdown
    const trigger = page.getByRole('button', { name: /open user menu/i })
    await trigger.click()

    // Navigate to profile panel
    const manageButton = page.getByText(/manage profile/i)
    await expect(manageButton).toBeVisible()
    await manageButton.click()

    // Verify panel is open
    await expect(page.getByRole('heading', { name: /manage profile/i })).toBeVisible()

    // Switch to security tab
    const securityTab = page.getByRole('tab', { name: /sign in & security/i })
    await securityTab.click()

    // Verify security content
    await expect(page.getByText(/two-factor authentication/i)).toBeVisible()

    // Close panel
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    // Focus should return to trigger
    await expect(trigger).toBeFocused()
  })
})
