import { test, expect } from '@playwright/test'

test('homepage default hero renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('homepage compact hero via query param', async ({ page }) => {
  await page.goto('/?hero=compact')
  await expect(page.getByText(/compact/i)).toBeVisible({ timeout: 5000 })
})
