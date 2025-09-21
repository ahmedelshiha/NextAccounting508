import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Navigation links', () => {
  it('includes cron telemetry link in navigation source', async () => {
    const navPath = resolve(__dirname, '../src/components/ui/navigation.tsx')
    const content = readFileSync(navPath, 'utf8')
    expect(content.includes('href="/admin/cron-telemetry"')).toBe(true)
    expect(content.includes('Cron Telemetry')).toBe(true)
  })

  it('admin telemetry page exists', async () => {
    const pagePath = resolve(__dirname, '../src/app/admin/cron-telemetry/page.tsx')
    const content = readFileSync(pagePath, 'utf8')
    expect(content.length).toBeGreaterThan(10)
  })
})
