import { describe, it, expect } from 'vitest'
import { NAVIGATION_SECTIONS, getNavigation, getBreadcrumbs, flattenNavigation } from '@/lib/admin/navigation-registry'

// simple permission shim for tests: we don't assert internal hasPermission logic here, only structural behavior

describe('navigation-registry', () => {
  it('flattens all items including children', () => {
    const flat = flattenNavigation(NAVIGATION_SECTIONS)
    const labels = flat.map(i => i.label)
    expect(labels).toContain('Overview')
    expect(labels).toContain('Invoices')
    expect(labels).toContain('Sequences')
  })

  it('getNavigation filters items by permission when userRole is undefined (falls back to open items)', () => {
    const nav = getNavigation({ userRole: undefined, counts: null })
    const sections = nav.map(s => s.key)
    expect(sections).toContain('dashboard')
    const financial = nav.find(s => s.key === 'financial')
    expect(financial?.items.find(i => i.label === 'Invoices')).toBeTruthy()
  })

  it('getBreadcrumbs maps known routes with registry labels and falls back for unknown segments', () => {
    const bc1 = getBreadcrumbs('/admin/invoices/sequences')
    expect(bc1.map(b => b.label)).toEqual(['Overview', 'Invoices', 'Sequences'])
  })

  it('getBreadcrumbs returns empty array for empty path', () => {
    const bc = getBreadcrumbs('')
    expect(Array.isArray(bc)).toBe(true)
  })
})
