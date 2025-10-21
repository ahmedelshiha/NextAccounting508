import { test, expect } from '@playwright/test'

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForNavigation()
  })

  test('should navigate to admin profile page', async ({ page }) => {
    await page.goto('/admin/profile')
    await expect(page).toHaveURL('/admin/profile')
    await expect(page.locator('text=Profile')).toBeVisible()
  })

  test('should load and display profile information', async ({ page }) => {
    await page.goto('/admin/profile')
    
    // Wait for profile tab to be visible
    const profileTab = page.locator('button[role="tab"]:has-text("Profile")')
    await profileTab.click()
    
    // Verify profile information loads
    await expect(page.locator('text=Full Name')).toBeVisible({ timeout: 5000 })
  })

  test('should update timezone preferences', async ({ page }) => {
    await page.goto('/admin/profile?tab=preferences')
    
    // Wait for Preferences tab to load
    await expect(page.locator('text=Timezone')).toBeVisible({ timeout: 5000 })
    
    // Open timezone dropdown
    const timezoneSelect = page.locator('select').first()
    await timezoneSelect.click()
    
    // Select a different timezone
    await page.locator('option[value="Europe/London"]').click()
    
    // Save preferences
    const saveButton = page.locator('button:has-text("Save")').last()
    await saveButton.click()
    
    // Wait for success message
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
  })

  test('should toggle booking notification preferences', async ({ page }) => {
    await page.goto('/admin/profile?tab=preferences')
    
    // Wait for preferences to load
    await expect(page.locator('text=Email Notifications')).toBeVisible({ timeout: 5000 })
    
    // Toggle email reminder checkbox
    const emailReminderCheckbox = page.locator('input[id="emailReminder"]')
    const isChecked = await emailReminderCheckbox.isChecked()
    
    await emailReminderCheckbox.click()
    
    // Verify checkbox state changed
    const newCheckedState = await emailReminderCheckbox.isChecked()
    expect(newCheckedState).toBe(!isChecked)
    
    // Save preferences
    const saveButton = page.locator('button:has-text("Save")').last()
    await saveButton.click()
    
    // Wait for success
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
  })

  test('should update reminder hours selection', async ({ page }) => {
    await page.goto('/admin/profile?tab=preferences')
    
    // Wait for reminder section
    await expect(page.locator('text=Reminder Timing')).toBeVisible({ timeout: 5000 })
    
    // Toggle reminder hours
    const reminder24h = page.locator('input[id="reminder-24"]')
    const reminder12h = page.locator('input[id="reminder-12"]')
    
    const wasChecked24 = await reminder24h.isChecked()
    
    await reminder12h.click()
    
    // Verify state changed
    const isChecked12 = await reminder12h.isChecked()
    expect(isChecked12).toBe(true)
    
    // Save
    const saveButton = page.locator('button:has-text("Save")').last()
    await saveButton.click()
    
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
  })

  test('should validate email field format', async ({ page }) => {
    await page.goto('/admin/profile')
    
    // Switch to profile tab
    const profileTab = page.locator('button[role="tab"]:has-text("Profile")')
    await profileTab.click()
    
    // Find and click email field
    const emailButton = page.locator('button:has-text("Email")').first()
    await emailButton.click()
    
    // Type invalid email
    const emailInput = page.locator('input[type="email"]')
    await emailInput.clear()
    await emailInput.type('invalid-email')
    
    // Try to save
    const saveBtn = page.locator('button:has-text("Save")').first()
    await saveBtn.click()
    
    // Should show validation error
    await expect(page.locator('text=Invalid email')).toBeVisible()
  })

  test('should access security settings tab', async ({ page }) => {
    await page.goto('/admin/profile')
    
    const securityTab = page.locator('button[role="tab"]:has-text("Sign in")').or(page.locator('button[role="tab"]:has-text("Security")'))
    await securityTab.click()
    
    // Verify security settings are visible
    await expect(page.locator('text=Password')).toBeVisible({ timeout: 5000 })
  })

  test('should navigate between profile tabs', async ({ page }) => {
    await page.goto('/admin/profile')
    
    // Get all tabs
    const tabs = page.locator('button[role="tab"]')
    const tabCount = await tabs.count()
    
    // Click each tab and verify it loads
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      const tab = tabs.nth(i)
      await tab.click()
      
      // Wait for content to load
      await page.waitForTimeout(500)
      
      // Verify tab is active
      await expect(tab).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('should handle preference save error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/user/preferences', route => {
      route.abort('failed')
    })
    
    await page.goto('/admin/profile?tab=preferences')
    
    // Wait for preferences to load
    await expect(page.locator('text=Timezone')).toBeVisible({ timeout: 5000 })
    
    // Try to save
    const saveButton = page.locator('button:has-text("Save")').last()
    await saveButton.click()
    
    // Should show error message
    await expect(page.locator('text=Failed')).toBeVisible({ timeout: 5000 })
  })

  test('should display account activity with pagination', async ({ page }) => {
    await page.goto('/admin/profile')
    
    const securityTab = page.locator('button[role="tab"]:has-text("Sign in")').or(page.locator('button[role="tab"]:has-text("Security")'))
    await securityTab.click()
    
    // Scroll to activity section
    await page.locator('text=Recent account activity').scrollIntoViewIfNeeded()
    
    // Verify activity is displayed
    await expect(page.locator('text=Recent account activity')).toBeVisible()
    
    // Check for pagination controls if many activities
    const nextButton = page.locator('button:has-text("Next")')
    if (await nextButton.isVisible()) {
      expect(await nextButton.isEnabled()).toBeDefined()
    }
  })

  test('should switch language preference', async ({ page }) => {
    await page.goto('/admin/profile?tab=preferences')
    
    // Wait for localization section
    await expect(page.locator('text=Preferred Language')).toBeVisible({ timeout: 5000 })
    
    // Open language dropdown
    const languageSelect = page.locator('select').last()
    await languageSelect.click()
    
    // Select different language
    await page.locator('option[value="ar"]').click()
    
    // Save
    const saveButton = page.locator('button:has-text("Save")').last()
    await saveButton.click()
    
    // Verify save
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
  })

  test('should persist preferences after page reload', async ({ page }) => {
    await page.goto('/admin/profile?tab=preferences')
    
    // Wait for load
    await expect(page.locator('text=Timezone')).toBeVisible({ timeout: 5000 })
    
    // Change timezone
    const timezoneSelect = page.locator('select').first()
    await timezoneSelect.click()
    await page.locator('option[value="Europe/Paris"]').click()
    
    // Save
    const saveButton = page.locator('button:has-text("Save")').last()
    await saveButton.click()
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
    
    // Reload page
    await page.reload()
    
    // Wait for preferences to reload
    await expect(page.locator('text=Timezone')).toBeVisible({ timeout: 5000 })
    
    // Verify timezone is still set
    const timezoneValue = await timezoneSelect.inputValue()
    expect(timezoneValue).toBe('Europe/Paris')
  })
})
