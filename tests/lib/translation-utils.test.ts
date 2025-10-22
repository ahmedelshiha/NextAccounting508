import { describe, it, expect } from 'vitest'
import {
  flattenTranslations,
  validateTranslationParity,
  getBaseKey,
  extractBaseKeys,
  validateNestedStructure,
  getTranslationCoverage,
  findMissingTranslations,
  findOrphanedTranslations
} from '@/lib/translation-utils'

describe('Translation Utilities', () => {
  describe('flattenTranslations', () => {
    it('should flatten nested object to dot notation', () => {
      const nested = {
        nav: { home: 'Home', about: 'About' },
        hero: { title: 'Welcome' }
      }
      const flat = flattenTranslations(nested)
      expect(flat).toEqual({
        'nav.home': 'Home',
        'nav.about': 'About',
        'hero.title': 'Welcome'
      })
    })

    it('should handle deeply nested structures', () => {
      const nested = {
        app: {
          header: {
            nav: {
              home: 'Home'
            }
          }
        }
      }
      const flat = flattenTranslations(nested)
      expect(flat['app.header.nav.home']).toBe('Home')
    })

    it('should handle flat objects', () => {
      const flat = { home: 'Home', about: 'About' }
      expect(flattenTranslations(flat)).toEqual(flat)
    })

    it('should skip null values', () => {
      const nested = { nav: { home: 'Home', about: null } }
      const flat = flattenTranslations(nested)
      expect(flat).not.toHaveProperty('nav.about')
      expect(flat['nav.home']).toBe('Home')
    })

    it('should skip arrays', () => {
      const nested = { nav: { items: ['Home', 'About'], title: 'Nav' } }
      const flat = flattenTranslations(nested)
      expect(flat).not.toHaveProperty('nav.items')
      expect(flat['nav.title']).toBe('Nav')
    })

    it('should skip non-string, non-object values', () => {
      const nested = { count: 5, nav: { home: 'Home' } }
      const flat = flattenTranslations(nested)
      expect(flat).not.toHaveProperty('count')
      expect(flat['nav.home']).toBe('Home')
    })
  })

  describe('validateNestedStructure', () => {
    it('should accept valid nested structure', () => {
      const nested = { nav: { home: 'Home', about: 'About' } }
      const errors = validateNestedStructure(nested)
      expect(errors).toHaveLength(0)
    })

    it('should reject null values', () => {
      const nested = { nav: { home: 'Home', about: null } }
      const errors = validateNestedStructure(nested)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('null')
    })

    it('should reject arrays', () => {
      const nested = { nav: { items: ['Home', 'About'] } }
      const errors = validateNestedStructure(nested)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].toLowerCase()).toContain('array')
    })

    it('should reject numbers', () => {
      const nested = { count: 5 }
      const errors = validateNestedStructure(nested)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('number')
    })

    it('should recursively validate nested structures', () => {
      const nested = { level1: { level2: { value: 'ok', bad: 123 } } }
      const errors = validateNestedStructure(nested)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('getBaseKey', () => {
    it('should return key unchanged when no gender suffix', () => {
      expect(getBaseKey('nav.home')).toBe('nav.home')
    })

    it('should remove male suffix', () => {
      expect(getBaseKey('greeting.welcome.male', ['male', 'female'])).toBe('greeting.welcome')
    })

    it('should remove female suffix', () => {
      expect(getBaseKey('greeting.welcome.female', ['male', 'female'])).toBe('greeting.welcome')
    })

    it('should remove neuter suffix', () => {
      expect(getBaseKey('greeting.welcome.neuter', ['male', 'female', 'neuter'])).toBe(
        'greeting.welcome'
      )
    })

    it('should handle keys without gender forms in the list', () => {
      expect(getBaseKey('greeting.welcome.male', ['female'])).toBe('greeting.welcome.male')
    })
  })

  describe('extractBaseKeys', () => {
    it('should extract unique base keys from flat translations', () => {
      const translations = {
        'greeting.welcome': 'Welcome',
        'greeting.welcome.male': 'Welcome Sir',
        'greeting.welcome.female': 'Welcome Madam',
        'nav.home': 'Home'
      }
      const baseKeys = extractBaseKeys(translations, ['male', 'female'])
      expect(baseKeys).toEqual(new Set(['greeting.welcome', 'nav.home']))
    })

    it('should return set of base keys', () => {
      const translations = {
        'nav.home': 'Home',
        'nav.about': 'About'
      }
      const baseKeys = extractBaseKeys(translations)
      expect(baseKeys).toEqual(new Set(['nav.home', 'nav.about']))
    })
  })

  describe('validateTranslationParity', () => {
    it('should accept identical key sets', () => {
      const locales = {
        en: { 'nav.home': 'Home', 'nav.about': 'About' },
        ar: { 'nav.home': 'الرئيسية', 'nav.about': 'حول' }
      }
      const errors = validateTranslationParity(locales)
      expect(errors).toHaveLength(0)
    })

    it('should report missing keys in target locale', () => {
      const locales = {
        en: { 'nav.home': 'Home', 'nav.about': 'About' },
        ar: { 'nav.home': 'الرئيسية' }
      }
      const errors = validateTranslationParity(locales)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('ar')
      expect(errors[0]).toContain('nav.about')
    })

    it('should report orphaned keys in target locale', () => {
      const locales = {
        en: { 'nav.home': 'Home' },
        ar: { 'nav.home': 'الرئيسية', 'nav.about': 'حول' }
      }
      const errors = validateTranslationParity(locales)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('ar')
      expect(errors[0]).toContain('orphaned')
    })
  })

  describe('getTranslationCoverage', () => {
    it('should return 100% for identical translations', () => {
      const reference = { 'nav.home': 'Home', 'nav.about': 'About' }
      const locale = { 'nav.home': 'Accueil', 'nav.about': 'À propos' }
      const coverage = getTranslationCoverage(locale, reference)
      expect(coverage).toBe(100)
    })

    it('should return 50% for half-translated', () => {
      const reference = { 'nav.home': 'Home', 'nav.about': 'About' }
      const locale = { 'nav.home': 'Accueil' }
      const coverage = getTranslationCoverage(locale, reference)
      expect(coverage).toBe(50)
    })

    it('should return 0% for no translations', () => {
      const reference = { 'nav.home': 'Home', 'nav.about': 'About' }
      const locale = {}
      const coverage = getTranslationCoverage(locale, reference)
      expect(coverage).toBe(0)
    })
  })

  describe('findMissingTranslations', () => {
    it('should return empty array for complete translations', () => {
      const reference = { 'nav.home': 'Home' }
      const locale = { 'nav.home': 'Accueil' }
      const missing = findMissingTranslations(locale, reference)
      expect(missing).toEqual([])
    })

    it('should report missing translations', () => {
      const reference = { 'nav.home': 'Home', 'nav.about': 'About' }
      const locale = { 'nav.home': 'Accueil' }
      const missing = findMissingTranslations(locale, reference)
      expect(missing).toContain('nav.about')
      expect(missing).not.toContain('nav.home')
    })

    it('should return sorted list', () => {
      const reference = { 'z.key': 'Z', 'a.key': 'A', 'm.key': 'M' }
      const locale = {}
      const missing = findMissingTranslations(locale, reference)
      expect(missing).toEqual(['a.key', 'm.key', 'z.key'])
    })
  })

  describe('findOrphanedTranslations', () => {
    it('should return empty array for clean translations', () => {
      const reference = { 'nav.home': 'Home' }
      const locale = { 'nav.home': 'Accueil' }
      const orphaned = findOrphanedTranslations(locale, reference)
      expect(orphaned).toEqual([])
    })

    it('should report orphaned translations', () => {
      const reference = { 'nav.home': 'Home' }
      const locale = { 'nav.home': 'Accueil', 'nav.old': 'Ancien' }
      const orphaned = findOrphanedTranslations(locale, reference)
      expect(orphaned).toContain('nav.old')
      expect(orphaned).not.toContain('nav.home')
    })

    it('should return sorted list', () => {
      const reference = {}
      const locale = { 'z.key': 'Z', 'a.key': 'A', 'm.key': 'M' }
      const orphaned = findOrphanedTranslations(locale, reference)
      expect(orphaned).toEqual(['a.key', 'm.key', 'z.key'])
    })
  })
})
