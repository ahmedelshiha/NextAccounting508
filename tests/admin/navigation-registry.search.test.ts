import { describe, it, expect } from 'vitest'
import { searchNav } from '@/lib/admin/navigation-registry'

describe('navigation-registry searchNav', () => {
  it('returns empty array for empty/whitespace query', () => {
    expect(searchNav('')).toEqual([])
    expect(searchNav('   ')).toEqual([])
  })

  it('prefers exact matches, then prefix, then substring, then keyword matches', () => {
    const qExact = searchNav('Overview', 3)
    expect(qExact[0]?.label).toBe('Overview')

    const qPrefix = searchNav('Inv', 3)
    // "Invoices" should be a strong prefix match
    expect(qPrefix.find(i => i.label === 'Invoices')).toBeTruthy()

    const qSubstring = searchNav('quest', 5)
    // Should match Requests via substring (Service Requests)
    expect(qSubstring.some(i => i.label.toLowerCase().includes('request'))).toBe(true)

    const qKeyword = searchNav('reports', 5)
    // "Reports" is a direct item and potential keyword; should appear
    expect(qKeyword.some(i => i.label === 'Reports')).toBe(true)
  })

  it('respects the provided limit', () => {
    const res = searchNav('a', 2)
    expect(res.length).toBeLessThanOrEqual(2)
  })
})
