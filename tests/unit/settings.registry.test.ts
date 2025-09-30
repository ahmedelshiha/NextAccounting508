import { describe, it, expect } from 'vitest'
import SETTINGS_REGISTRY from '@/lib/settings/registry'

describe('SETTINGS_REGISTRY', () => {
  it('is a non-empty array of categories', () => {
    expect(Array.isArray(SETTINGS_REGISTRY)).toBe(true)
    expect(SETTINGS_REGISTRY.length).toBeGreaterThan(0)
  })

  it('every category has key, label, and route with /admin/settings prefix', () => {
    for (const c of SETTINGS_REGISTRY) {
      expect(typeof c.key).toBe('string')
      expect(c.key.length).toBeGreaterThan(0)
      expect(typeof c.label).toBe('string')
      expect(c.label.length).toBeGreaterThan(0)
      expect(typeof c.route).toBe('string')
      expect(c.route.startsWith('/admin/settings/')).toBe(true)
      // icon and tabs are optional, but if present should be of correct type
      if (c.icon) expect(typeof c.icon).toBe('function')
      if (c.tabs) expect(Array.isArray(c.tabs)).toBe(true)
    }
  })

  it('contains expected baseline categories and unique keys', () => {
    const keys = SETTINGS_REGISTRY.map(c => c.key)
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)

    // baseline presence (do not assert full list to allow evolution)
    const baseline = [
      'organization',
      'booking',
      'financial',
      'integrationHub',
      'systemAdministration',
    ]
    for (const k of baseline) expect(keys).toContain(k)
  })
})
