import { resolve } from 'path'

describe('Admin Analytics page template wiring', () => {
  it('references StandardPage and BusinessIntelligence, with export endpoints', () => {
    const p = resolve(__dirname, '../../src/app/admin/analytics/page.tsx')
    const src = readFileSync(p, 'utf8')
    expect(src.includes('StandardPage')).toBe(true)
    expect(src.includes('BusinessIntelligence')).toBe(true)
    expect(src.includes('/api/admin/export?entity=users')).toBe(true)
    expect(src.includes('/api/admin/export?entity=bookings')).toBe(true)
    expect(src.includes('/api/admin/export?entity=services')).toBe(true)
  })
})
