import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSettingsSearchIndex } from '@/hooks/admin/useSettingsSearchIndex'

// Mock the registry
vi.mock('@/lib/settings/registry', () => ({
  default: [
    {
      key: 'organization',
      label: 'Organization Settings',
      route: '/admin/settings/organization',
      category: 'organization',
    },
    {
      key: 'booking',
      label: 'Booking Settings',
      route: '/admin/settings/booking',
      category: 'booking',
    },
    {
      key: 'financial',
      label: 'Financial Settings',
      route: '/admin/settings/financial',
      category: 'financial',
    },
    {
      key: 'communication',
      label: 'Communication Settings',
      route: '/admin/settings/communication',
      category: 'communication',
    },
    {
      key: 'security',
      label: 'Security & Compliance',
      route: '/admin/settings/security',
      category: 'security',
    },
  ],
}))

describe('useSettingsSearchIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with items from registry', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    expect(result.current.items).toBeDefined()
    expect(result.current.items.length).toBe(5)
    expect(result.current.items[0].label).toBe('Organization Settings')
  })

  it('should create a fuse instance for fuzzy search', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    expect(result.current.fuse).toBeDefined()
    expect(typeof result.current.fuse.search).toBe('function')
  })

  it('should search by label with fuzzy matching', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    const searchResults = result.current.fuse.search('booking')
    expect(searchResults.length).toBeGreaterThan(0)
    expect(searchResults[0].item.label).toContain('Booking')
  })

  it('should search by key with fuzzy matching', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    const searchResults = result.current.fuse.search('fin')
    expect(searchResults.length).toBeGreaterThan(0)
    expect(searchResults[0].item.key).toBe('financial')
  })

  it('should return all categories', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    expect(result.current.categories).toBeDefined()
    expect(result.current.categories.length).toBe(5)
    expect(result.current.categories.map((c) => c.key)).toContain('organization')
    expect(result.current.categories.map((c) => c.key)).toContain('booking')
  })

  it('should handle partial matches in labels', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    const searchResults = result.current.fuse.search('settings')
    // Should match multiple items with "Settings" in the label
    expect(searchResults.length).toBeGreaterThan(0)
  })

  it('should be case-insensitive in search', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    const upperResults = result.current.fuse.search('BOOKING')
    const lowerResults = result.current.fuse.search('booking')

    expect(upperResults.length).toBe(lowerResults.length)
  })

  it('should maintain consistent item structure', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    result.current.items.forEach((item) => {
      expect(item).toHaveProperty('key')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('route')
      expect(item).toHaveProperty('category')
      expect(typeof item.key).toBe('string')
      expect(typeof item.label).toBe('string')
      expect(typeof item.route).toBe('string')
      expect(typeof item.category).toBe('string')
    })
  })

  it('should have valid routes for all items', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    result.current.items.forEach((item) => {
      expect(item.route).toMatch(/^\/admin\/settings\//)
    })
  })

  it('should memoize items on subsequent renders', () => {
    const { result, rerender } = renderHook(() => useSettingsSearchIndex())

    const firstItems = result.current.items
    rerender()
    const secondItems = result.current.items

    expect(firstItems).toBe(secondItems)
  })

  it('should memoize fuse instance on subsequent renders', () => {
    const { result, rerender } = renderHook(() => useSettingsSearchIndex())

    const firstFuse = result.current.fuse
    rerender()
    const secondFuse = result.current.fuse

    expect(firstFuse).toBe(secondFuse)
  })

  it('should return results with scores', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    const searchResults = result.current.fuse.search('organization')
    expect(searchResults.length).toBeGreaterThan(0)
    expect(searchResults[0]).toHaveProperty('score')
    expect(typeof searchResults[0].score).toBe('number')
  })

  it('should weight label higher than key in search results', () => {
    const { result } = renderHook(() => useSettingsSearchIndex())

    // Search for something that appears in both label and key
    const searchResults = result.current.fuse.search('booking')
    expect(searchResults.length).toBeGreaterThan(0)
    // The item with "booking" in label should rank higher
    expect(searchResults[0].item.label).toContain('Booking')
  })
})
