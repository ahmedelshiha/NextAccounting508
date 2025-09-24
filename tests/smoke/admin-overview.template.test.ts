import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Admin Overview uses AnalyticsPage template', () => {
  it('src/app/admin/page.tsx references AnalyticsPage and KPI grid', () => {
    const p = resolve(__dirname, '../../src/app/admin/page.tsx')
    const src = readFileSync(p, 'utf8')
    expect(src.includes("AnalyticsPage")).toBe(true)
    expect(src.includes("ProfessionalKPIGrid") || src.includes('ProfessionalKPIGrid')).toBe(true)
  })
})
