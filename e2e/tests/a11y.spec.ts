import { test, expect } from '@playwright/test'

async function injectAxe(page) {
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js' })
}

test.describe('Accessibility (axe-core)', () => {
  test('homepage has no critical a11y violations', async ({ page }) => {
    await page.goto('/')
    await injectAxe(page)
    const results = await page.evaluate(async () => {
      // @ts-expect-error
      const r = await window.axe.run(document, { resultTypes: ['violations'] })
      const critical = r.violations.filter(v => (v.impact || '').toLowerCase() === 'critical')
      return { count: critical.length, details: critical.map(v => v.id) }
    })
    expect(results.count, `Critical violations: ${results.details.join(',')}`).toBe(0)
  })
})
