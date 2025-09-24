import { resolve } from 'path'

describe('Admin Reports page template wiring', () => {
  it('references StandardPage and export endpoints', () => {
    const p = resolve(__dirname, '../../src/app/admin/reports/page.tsx')
    const src = readFileSync(p, 'utf8')
    expect(src.includes('StandardPage')).toBe(true)
    expect(src.includes('/api/admin/export?entity=users')).toBe(true)
    expect(src.includes('/api/admin/export?entity=bookings')).toBe(true)
    expect(src.includes('/api/admin/export?entity=services')).toBe(true)
  })
})
