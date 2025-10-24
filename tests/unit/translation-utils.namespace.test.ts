import { describe, it, expect } from 'vitest'
import { flattenTranslations, validateNestedStructure } from '@/lib/translation-utils'

describe('translation-utils namespace handling', () => {
  it('validates nested structure', () => {
    const valid = {
      nav: { home: 'Home', about: 'About' },
      footer: { copyright: '© {{year}}' },
    }
    expect(validateNestedStructure(valid)).toEqual([])

    const invalid: any = { nav: { list: ['a', 'b'] } }
    const errs = validateNestedStructure(invalid)
    expect(errs.length).toBeGreaterThan(0)
  })

  it('flattens deeply nested objects', () => {
    const nested = {
      a: {
        b: {
          c: 'val',
          d: { e: 'x' },
        },
      },
    }
    const flat = flattenTranslations(nested as any)
    expect(flat['a.b.c']).toBe('val')
    expect(flat['a.b.d.e']).toBe('x')
  })
})
