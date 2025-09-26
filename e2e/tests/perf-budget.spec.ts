import { test, expect } from '@playwright/test'

test('homepage LCP and CLS within budget', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' })

  const perf = await page.evaluate(() => {
    const lcpEntries = [] as any[]
    const clsEntries = [] as any[]
    let cls = 0

    try {
      const poLCP = new PerformanceObserver((entryList) => {
        // @ts-expect-error
        lcpEntries.push(...entryList.getEntries())
      })
      // @ts-expect-error
      poLCP.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {}

    try {
      const poCLS = new PerformanceObserver((entryList) => {
        // @ts-expect-error
        for (const entry of entryList.getEntries()) {
          // @ts-expect-error
          if (!entry.hadRecentInput) cls += entry.value || 0
          // @ts-expect-error
          clsEntries.push(entry)
        }
      })
      // @ts-expect-error
      poCLS.observe({ type: 'layout-shift', buffered: true })
    } catch {}

    return new Promise<{ lcp: number; cls: number }>((resolve) => {
      window.addEventListener('load', () => {
        setTimeout(() => {
          // @ts-expect-error
          const lcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : 0
          resolve({ lcp, cls })
        }, 0)
      })
    })
  })

  // Budgets: LCP < 2500ms, CLS < 0.1
  expect(perf.lcp).toBeLessThan(2500)
  expect(perf.cls).toBeLessThan(0.1)
})
