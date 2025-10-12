import { test, expect } from '@playwright/test'

test.describe('Admin sidebar - keyboard and resize', () => {
  test('keyboard toggle (Mod+B) and resize via resizer', async ({ page }) => {
    await page.goto('/admin')

    const sidebar = page.getByRole('navigation', { name: 'Admin sidebar' })
    await expect(sidebar).toBeVisible()

    // Get initial width
    const initialWidth = await sidebar.evaluate((el) => parseFloat(getComputedStyle(el as Element).width))
    expect(initialWidth).toBeGreaterThan(100)

    // Send Mod+B (Ctrl on CI and most environments)
    await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control')
    await page.keyboard.press('b')
    await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control')

    // After toggle, width should decrease (collapsed)
    const collapsedWidth = await sidebar.evaluate((el) => parseFloat(getComputedStyle(el as Element).width))
    expect(collapsedWidth).toBeLessThan(initialWidth)

    // Expand again via Mod+B
    await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control')
    await page.keyboard.press('b')
    await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control')

    const expandedWidth = await sidebar.evaluate((el) => parseFloat(getComputedStyle(el as Element).width))
    expect(expandedWidth).toBeGreaterThan(collapsedWidth)

    // Find resizer (separator) and drag to enlarge width
    const resizer = page.locator('[role="separator"][aria-orientation="vertical"]')
    await expect(resizer).toBeVisible()

    const box = await resizer.boundingBox()
    if (!box) {
      test.skip(true, 'Resizer bounding box not available')
      return
    }

    // Start drag at center, move 100px to the right
    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 100, startY, { steps: 10 })
    await page.mouse.up()

    const afterDragWidth = await sidebar.evaluate((el) => parseFloat(getComputedStyle(el as Element).width))
    expect(afterDragWidth).toBeGreaterThan(expandedWidth)
  })
})
