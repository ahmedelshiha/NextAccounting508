import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Navigation links', () => {
  it('includes cron telemetry link in admin sidebar', async () => {
    const sidebarPath = resolve(__dirname, '../src/components/admin/layout/AdminSidebar.tsx')
    const content = readFileSync(sidebarPath, 'utf8')
    expect(content.includes('href="/admin/cron-telemetry"')).toBe(true)
    expect(content.includes('Cron Telemetry')).toBe(true)
  })

  it('admin telemetry page exists', async () => {
    const pagePath = resolve(__dirname, '../src/app/admin/cron-telemetry/page.tsx')
    const content = readFileSync(pagePath, 'utf8')
    expect(content.length).toBeGreaterThan(10)
  })
})
