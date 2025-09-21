import { describe, it, expect } from 'vitest'
import { generateSlug, sanitizeServiceData, formatDuration, formatPrice, extractCategories, sortServices, filterServices, validateBulkAction } from '@/lib/services/utils'

describe('services utils', () => {
  it('generateSlug creates url-friendly slugs', () => {
    expect(generateSlug('Test Service')).toBe('test-service')
    expect(generateSlug('  Complex & Name!! ')).toBe('complex-name')
    expect(generateSlug('Ünicode Näme')).toBe('ünicode-näme')
  })

  it('sanitizeServiceData trims and validates fields', () => {
    const input = {
      name: '  My Service  ',
      slug: 'My-Slug ',
      description: '  desc  ',
      shortDesc: ' short ',
      category: ' cat ',
      price: '12.50',
      duration: '90',
      features: [' a ', 'b'],
      featured: 'true',
      active: 1,
      image: 'https://example.com/img.png'
    } as any

    const out = sanitizeServiceData(input)
    expect(out.name).toBe('My Service')
    expect(out.slug).toBe('my-slug')
    expect(out.description).toBe('desc')
    expect(out.shortDesc).toBe('short')
    expect(out.category).toBe('cat')
    expect(out.price).toBeCloseTo(12.5)
    expect(out.duration).toBe(90)
    expect(out.features).toEqual(['a','b'])
    expect(out.featured).toBeTruthy()
    expect(out.active).toBeTruthy()
    expect(out.image).toBe('https://example.com/img.png')
  })

  it('sanitizeServiceData rejects invalid image urls', () => {
    expect(() => sanitizeServiceData({ image: 'not-a-url' } as any)).toThrow(/Invalid image URL/)
  })

  it('formatDuration outputs sensible values', () => {
    expect(formatDuration(null)).toBe('Not specified')
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(1500)).toBe('1d 1h')
  })

  it('formatPrice formats currency and handles null', () => {
    expect(formatPrice(null)).toBe('Contact for pricing')
    expect(formatPrice(10)).toContain('10')
  })

  it('extractCategories returns unique sorted categories', () => {
    const list = [{ category: 'B' }, { category: 'A' }, { category: 'B' }, { category: '' }]
    expect(extractCategories(list)).toEqual(['A','B'])
  })

  it('sortServices sorts by name and price and dates', () => {
    const items = [
      { name: 'b', price: 5, createdAt: '2020-01-02' },
      { name: 'a', price: 10, createdAt: '2020-01-01' }
    ]
    expect(sortServices(items as any, 'name', 'asc')[0].name).toBe('a')
    expect(sortServices(items as any, 'price', 'desc')[0].price).toBe(10)
  })

  it('filterServices applies search, status, featured and price filters', () => {
    const srv = [
      { name: 'One', slug: 'one', shortDesc: 's', description: 'x', category: 'cat', active: true, featured: true, price: 100 },
      { name: 'Two', slug: 'two', shortDesc: 's', description: 'y', category: 'other', active: false, featured: false, price: 10 }
    ]
    expect(filterServices(srv, { search: 'one' }).length).toBe(1)
    expect(filterServices(srv, { status: 'active' }).length).toBe(1)
    expect(filterServices(srv, { featured: 'featured' }).length).toBe(1)
    expect(filterServices(srv, { minPrice: 50 }).length).toBe(1)
  })

  it('validateBulkAction enforces requirements', () => {
    expect(validateBulkAction('activate', [], undefined).isValid).toBe(false)
    expect(validateBulkAction('category', ['1'], '').isValid).toBe(false)
    expect(validateBulkAction('price-update', ['1'], -5).isValid).toBe(false)
    expect(validateBulkAction('price-update', ['1'], 10).isValid).toBe(true)
  })
})
