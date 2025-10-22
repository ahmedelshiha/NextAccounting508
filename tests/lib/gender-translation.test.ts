import { describe, it, expect } from 'vitest'
import {
  supportsGender,
  getGenderFormsForLocale,
  isValidGenderForLocale,
  buildGenderKey,
  buildGenderKeyFallbacks,
  getDefaultGenderForLocale,
  genderVariants,
  genderFormMap,
  defaultGenderForLocale,
  genderMetadata
} from '@/lib/gender-rules'
import type { Locale } from '@/lib/i18n'

describe('Gender Rules Utility', () => {
  describe('supportsGender', () => {
    it('should return false for English', () => {
      expect(supportsGender('en')).toBe(false)
    })

    it('should return true for Arabic', () => {
      expect(supportsGender('ar')).toBe(true)
    })

    it('should return true for Hindi', () => {
      expect(supportsGender('hi')).toBe(true)
    })
  })

  describe('getGenderFormsForLocale', () => {
    it('should return empty array for English', () => {
      expect(getGenderFormsForLocale('en')).toEqual([])
    })

    it('should return [male, female] for Arabic', () => {
      expect(getGenderFormsForLocale('ar')).toEqual(['male', 'female'])
    })

    it('should return [male, female, neuter] for Hindi', () => {
      expect(getGenderFormsForLocale('hi')).toEqual(['male', 'female', 'neuter'])
    })
  })

  describe('isValidGenderForLocale', () => {
    it('should accept undefined gender for all locales', () => {
      expect(isValidGenderForLocale(undefined, 'en')).toBe(true)
      expect(isValidGenderForLocale(undefined, 'ar')).toBe(true)
      expect(isValidGenderForLocale(undefined, 'hi')).toBe(true)
    })

    it('should accept male for all locales', () => {
      expect(isValidGenderForLocale('male', 'en')).toBe(false) // EN doesn't support
      expect(isValidGenderForLocale('male', 'ar')).toBe(true)
      expect(isValidGenderForLocale('male', 'hi')).toBe(true)
    })

    it('should accept female for AR and HI', () => {
      expect(isValidGenderForLocale('female', 'en')).toBe(false)
      expect(isValidGenderForLocale('female', 'ar')).toBe(true)
      expect(isValidGenderForLocale('female', 'hi')).toBe(true)
    })

    it('should accept neuter only for Hindi', () => {
      expect(isValidGenderForLocale('neuter', 'en')).toBe(false)
      expect(isValidGenderForLocale('neuter', 'ar')).toBe(false)
      expect(isValidGenderForLocale('neuter', 'hi')).toBe(true)
    })
  })

  describe('buildGenderKey', () => {
    it('should return base key for English', () => {
      expect(buildGenderKey('greeting.welcome', 'male', 'en')).toBe('greeting.welcome')
      expect(buildGenderKey('greeting.welcome', 'female', 'en')).toBe('greeting.welcome')
    })

    it('should return base key if gender is undefined', () => {
      expect(buildGenderKey('greeting.welcome', undefined, 'ar')).toBe('greeting.welcome')
      expect(buildGenderKey('greeting.welcome', undefined, 'hi')).toBe('greeting.welcome')
    })

    it('should append .male for Arabic male form', () => {
      expect(buildGenderKey('greeting.welcome', 'male', 'ar')).toBe('greeting.welcome.male')
    })

    it('should append .female for Arabic female form', () => {
      expect(buildGenderKey('greeting.welcome', 'female', 'ar')).toBe('greeting.welcome.female')
    })

    it('should append gender form for Hindi', () => {
      expect(buildGenderKey('greeting.welcome', 'male', 'hi')).toBe('greeting.welcome.male')
      expect(buildGenderKey('greeting.welcome', 'female', 'hi')).toBe('greeting.welcome.female')
      expect(buildGenderKey('greeting.welcome', 'neuter', 'hi')).toBe('greeting.welcome.neuter')
    })

    it('should handle invalid gender for locale gracefully', () => {
      expect(buildGenderKey('greeting.welcome', 'neuter', 'ar')).toBe('greeting.welcome')
      expect(buildGenderKey('greeting.welcome', 'male', 'en')).toBe('greeting.welcome')
    })
  })

  describe('buildGenderKeyFallbacks', () => {
    it('should return only base key for English', () => {
      const fallbacks = buildGenderKeyFallbacks('greeting.welcome', 'male', 'en')
      expect(fallbacks).toEqual(['greeting.welcome'])
    })

    it('should return [gender-key, base-key] for Arabic', () => {
      const fallbacks = buildGenderKeyFallbacks('greeting.welcome', 'female', 'ar')
      expect(fallbacks).toEqual(['greeting.welcome.female', 'greeting.welcome'])
    })

    it('should return [gender-key, base-key] for Hindi', () => {
      const fallbacks = buildGenderKeyFallbacks('greeting.welcome', 'neuter', 'hi')
      expect(fallbacks).toEqual(['greeting.welcome.neuter', 'greeting.welcome'])
    })

    it('should return [base-key] if gender undefined', () => {
      const fallbacks = buildGenderKeyFallbacks('greeting.welcome', undefined, 'ar')
      expect(fallbacks).toEqual(['greeting.welcome'])
    })

    it('should return [base-key] if gender invalid for locale', () => {
      const fallbacks = buildGenderKeyFallbacks('greeting.welcome', 'neuter', 'ar')
      expect(fallbacks).toEqual(['greeting.welcome'])
    })

    it('should maintain order: gender-specific first, base key as fallback', () => {
      const fallbacks = buildGenderKeyFallbacks('profile.accountType', 'male', 'hi')
      expect(fallbacks[0]).toBe('profile.accountType.male')
      expect(fallbacks[fallbacks.length - 1]).toBe('profile.accountType')
    })
  })

  describe('getDefaultGenderForLocale', () => {
    it('should return undefined for English', () => {
      expect(getDefaultGenderForLocale('en')).toBeUndefined()
    })

    it('should return male as default for Arabic', () => {
      expect(getDefaultGenderForLocale('ar')).toBe('male')
    })

    it('should return male as default for Hindi', () => {
      expect(getDefaultGenderForLocale('hi')).toBe('male')
    })
  })

  describe('Gender metadata', () => {
    it('should provide metadata for all supported locales', () => {
      expect(genderMetadata.en).toBeDefined()
      expect(genderMetadata.ar).toBeDefined()
      expect(genderMetadata.hi).toBeDefined()
    })

    it('should have description for each locale', () => {
      expect(genderMetadata.en.description).toBeTruthy()
      expect(genderMetadata.ar.description).toBeTruthy()
      expect(genderMetadata.hi.description).toBeTruthy()
    })

    it('should indicate English has no gender', () => {
      expect(genderMetadata.en.description).toMatch(/English.*no.*gender/i)
    })

    it('should indicate Arabic has masculine and feminine', () => {
      expect(genderMetadata.ar.description).toMatch(/masculine.*feminine/i)
    })

    it('should indicate Hindi has all three forms', () => {
      expect(genderMetadata.hi.description).toMatch(/masculine.*feminine.*neuter/i)
    })
  })

  describe('Gender configuration consistency', () => {
    it('should have genderVariants and genderFormMap in sync', () => {
      const arForms = genderVariants.ar
      arForms.forEach((form) => {
        expect(genderFormMap[form]).toBeDefined()
      })

      const hiForms = genderVariants.hi
      hiForms.forEach((form) => {
        expect(genderFormMap[form]).toBeDefined()
      })
    })

    it('should have defaultGenderForLocale values that are valid or undefined', () => {
      Object.entries(defaultGenderForLocale).forEach(([locale, gender]) => {
        const localeKey = locale as Locale
        if (gender) {
          expect(isValidGenderForLocale(gender, localeKey)).toBe(true)
        }
      })
    })

    it('should maintain locale type consistency', () => {
      const locales: Locale[] = ['en', 'ar', 'hi']
      locales.forEach((locale) => {
        expect(genderVariants[locale]).toBeDefined()
        expect(genderMetadata[locale]).toBeDefined()
      })
    })
  })

  describe('Edge cases and validation', () => {
    it('should handle keys with special characters', () => {
      const key = 'greeting.welcome_special'
      const genderKey = buildGenderKey(key, 'female', 'ar')
      expect(genderKey).toBe('greeting.welcome_special.female')
    })

    it('should handle keys with numbers', () => {
      const key = 'message.id123'
      const genderKey = buildGenderKey(key, 'male', 'hi')
      expect(genderKey).toBe('message.id123.male')
    })

    it('should preserve exact key format', () => {
      const key = 'section.subsection.key'
      const genderKey = buildGenderKey(key, 'female', 'ar')
      expect(genderKey).toBe('section.subsection.key.female')
    })

    it('should not add gender suffix to base key if validation fails', () => {
      const key = 'greeting.welcome'
      const result1 = buildGenderKey(key, 'neuter', 'ar') // neuter invalid for AR
      const result2 = buildGenderKey(key, 'male', 'en') // male invalid for EN
      expect(result1).toBe(key)
      expect(result2).toBe(key)
    })
  })
})
