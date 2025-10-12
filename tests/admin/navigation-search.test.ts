import { describe, it, expect } from 'vitest'
import { searchNav } from '@/lib/admin/navigation-registry'

describe('navigation search', () => {
  it('finds invoices by label', () => {
    const res = searchNav('Invoices', 3)
    expect(res[0]?.href).toBe('/admin/invoices')
  })
  it('finds analytics by keyword', () => {
    const res = searchNav('charts', 3)
    const labels = res.map(r => r.label)
    expect(labels.join(' ')).toMatch(/Analytics/)
  })
})
