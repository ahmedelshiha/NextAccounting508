import { describe, it, expect } from 'vitest'
import { getPluralForm } from '@/lib/i18n-plural'

describe('getPluralForm', () => {
  describe('English (en)', () => {
    it('should return "one" for count = 1', () => {
      expect(getPluralForm('en', 1)).toBe('one')
    })

    it('should return "other" for count = 0', () => {
      expect(getPluralForm('en', 0)).toBe('other')
    })

    it('should return "other" for count > 1', () => {
      expect(getPluralForm('en', 2)).toBe('other')
      expect(getPluralForm('en', 100)).toBe('other')
    })

    it('should handle negative numbers', () => {
      // Negative numbers are treated as their absolute value for CLDR rules
      // So -1 becomes 1, which is singular (one)
      expect(getPluralForm('en', -1)).toBe('one')
      expect(getPluralForm('en', -5)).toBe('other')
    })

    it('should handle decimals by flooring', () => {
      // Decimals are floored, so 1.9 becomes 1 (singular), and 1.1 also becomes 1 (singular)
      expect(getPluralForm('en', 1.9)).toBe('one')
      expect(getPluralForm('en', 1.1)).toBe('one')
    })
  })

  describe('Hindi (hi)', () => {
    it('should return "one" for count = 1', () => {
      expect(getPluralForm('hi', 1)).toBe('one')
    })

    it('should return "other" for count = 0', () => {
      expect(getPluralForm('hi', 0)).toBe('other')
    })

    it('should return "other" for count > 1', () => {
      expect(getPluralForm('hi', 2)).toBe('other')
      expect(getPluralForm('hi', 100)).toBe('other')
    })
  })

  describe('Arabic (ar)', () => {
    it('should return "zero" for count = 0', () => {
      expect(getPluralForm('ar', 0)).toBe('zero')
    })

    it('should return "one" for count = 1', () => {
      expect(getPluralForm('ar', 1)).toBe('one')
    })

    it('should return "two" for count = 2', () => {
      expect(getPluralForm('ar', 2)).toBe('two')
    })

    it('should return "few" for 3-10', () => {
      expect(getPluralForm('ar', 3)).toBe('few')
      expect(getPluralForm('ar', 5)).toBe('few')
      expect(getPluralForm('ar', 10)).toBe('few')
    })

    it('should return "many" for 11-99', () => {
      expect(getPluralForm('ar', 11)).toBe('many')
      expect(getPluralForm('ar', 50)).toBe('many')
      expect(getPluralForm('ar', 99)).toBe('many')
    })

    it('should return "other" for 100+', () => {
      expect(getPluralForm('ar', 100)).toBe('other')
      expect(getPluralForm('ar', 101)).toBe('other')
      expect(getPluralForm('ar', 1000)).toBe('other')
    })

    it('should handle modulo calculations with negative numbers', () => {
      // Negative numbers are treated as their absolute value, so -5 becomes 5
      // 5 % 100 = 5, which is in the 3-10 range, so 'few'
      expect(getPluralForm('ar', -5)).toBe('few')
    })

    it('should return "many" for numbers ending in 11-99 (e.g., 111-199, 211-299)', () => {
      expect(getPluralForm('ar', 111)).toBe('many')
      expect(getPluralForm('ar', 199)).toBe('many')
      expect(getPluralForm('ar', 211)).toBe('many')
      expect(getPluralForm('ar', 299)).toBe('many')
    })
  })

  describe('Default behavior', () => {
    it('should use fallback rules for unknown locales', () => {
      // Unknown locale defaults to "one" for 1, "other" for rest
      expect(getPluralForm('de' as any, 1)).toBe('one')
      expect(getPluralForm('de' as any, 2)).toBe('other')
    })
  })
})
