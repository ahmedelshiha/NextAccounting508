import { test, expect } from '@playwright/test'

// Assumes test environment provides an authenticated session or a seeded login helper
// Navigate to /admin and verify dropdown opens and panel appears

test('user menu opens and Manage Profile launches panel', async ({ page }) => {
  await page.goto('/admin')
  const trigger = page.getByRole('button', { name: /open user menu/i })
  await expect(trigger).toBeVisible()
  await trigger.click()
  await page.getByRole('menuitem', { name: /manage profile/i }).click()
  await expect(page.getByRole('heading', { level: 2, name: /manage profile/i })).toBeVisible()
  // Close and focus returns to trigger
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})
