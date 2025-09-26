import { test, expect } from '@playwright/test'

test('homepage LCP and CLS within budget', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' })

  const perf = await page.evaluate(() => {
    const lcpEntries = [] as any[]
    const clsEntries = [] as any[]
    let cls = 0

    try {
      const poLCP = new PerformanceObserver((entryList) => {
        // @ts-ignore
        lcpEntries.push(...entryList.getEntries())
      })
      // @ts-ignore
      poLCP.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {}

    try {
      const poCLS = new PerformanceObserver((entryList) => {
        // @ts-ignore
        for (const entry of entryList.getEntries()) {
          // @ts-ignore
          if (!entry.hadRecentInput) cls += entry.value || 0
          // @ts-ignore
          clsEntries.push(entry)
        }
      })
      // @ts-ignore
      poCLS.observe({ type: 'layout-shift', buffered: true })
    } catch {}

    return new Promise<{ lcp: number; cls: number }>((resolve) => {
      window.addEventListener('load', () => {
        setTimeout(() => {
          // @ts-ignore
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
