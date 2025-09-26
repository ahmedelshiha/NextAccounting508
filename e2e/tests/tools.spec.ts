import { test, expect } from '@playwright/test'

test.describe('Financial Tools', () => {
  test('Tax calculator updates results', async ({ page }) => {
    await page.goto('/resources/tools')
    const income = page.getByLabel('Annual Income')
    await income.fill('100000')
    const ded = page.getByLabel('Deductions')
    await ded.fill('10000')
    const rate = page.getByLabel('Tax Rate %')
    await rate.fill('20')
    await expect(page.getByText('Estimated Tax')).toBeVisible()
    await expect(page.getByText('$18,000.00')).toBeVisible()
  })

  test('ROI calculator updates results', async ({ page }) => {
    await page.goto('/resources/tools')
    await page.getByLabel('Service Cost').fill('1000')
    await page.getByLabel('Monthly Benefit').fill('500')
    await page.getByLabel('Months').fill('6')
    await expect(page.getByText('ROI')).toBeVisible()
    await expect(page.getByText('200.0%')).toBeVisible()
  })
})
