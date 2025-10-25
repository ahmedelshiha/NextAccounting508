import { describe, it, expect } from 'vitest'
import {
  buildGenderKey,
  buildGenderKeyFallbacks,
  getDefaultGenderForLocale,
  getGenderFormsForLocale,
  isValidGenderForLocale,
  supportsGender,
  genderVariants,
  defaultGenderForLocale
} from '@/lib/gender-rules'

describe('Gender Rules', () => {
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

    it('should return male and female for Arabic', () => {
      expect(getGenderFormsForLocale('ar')).toEqual(['male', 'female'])
    })

    it('should return male, female, and neuter for Hindi', () => {
      expect(getGenderFormsForLocale('hi')).toEqual(['male', 'female', 'neuter'])
    })
  })

  describe('isValidGenderForLocale', () => {
    it('should accept undefined for all locales', () => {
      expect(isValidGenderForLocale(undefined, 'en')).toBe(true)
      expect(isValidGenderForLocale(undefined, 'ar')).toBe(true)
      expect(isValidGenderForLocale(undefined, 'hi')).toBe(true)
    })

    it('should not accept gender for English', () => {
      expect(isValidGenderForLocale('male', 'en')).toBe(false)
      expect(isValidGenderForLocale('female', 'en')).toBe(false)
    })

    it('should accept male and female for Arabic', () => {
      expect(isValidGenderForLocale('male', 'ar')).toBe(true)
      expect(isValidGenderForLocale('female', 'ar')).toBe(true)
    })

    it('should not accept neuter for Arabic', () => {
      expect(isValidGenderForLocale('neuter', 'ar')).toBe(false)
    })

    it('should accept all genders for Hindi', () => {
      expect(isValidGenderForLocale('male', 'hi')).toBe(true)
      expect(isValidGenderForLocale('female', 'hi')).toBe(true)
      expect(isValidGenderForLocale('neuter', 'hi')).toBe(true)
    })
  })

  describe('buildGenderKey', () => {
    it('should return base key for English (no gender support)', () => {
      expect(buildGenderKey('greeting.welcome', 'male', 'en')).toBe('greeting.welcome')
      expect(buildGenderKey('greeting.welcome', undefined, 'en')).toBe('greeting.welcome')
    })

    it('should append gender suffix for Arabic', () => {
      expect(buildGenderKey('greeting.welcome', 'male', 'ar')).toBe('greeting.welcome.male')
      expect(buildGenderKey('greeting.welcome', 'female', 'ar')).toBe('greeting.welcome.female')
    })

    it('should append gender suffix for Hindi', () => {
      expect(buildGenderKey('greeting.welcome', 'male', 'hi')).toBe('greeting.welcome.male')
      expect(buildGenderKey('greeting.welcome', 'female', 'hi')).toBe('greeting.welcome.female')
      expect(buildGenderKey('greeting.welcome', 'neuter', 'hi')).toBe('greeting.welcome.neuter')
    })

    it('should return base key for unsupported gender', () => {
      expect(buildGenderKey('greeting.welcome', 'neuter', 'ar')).toBe('greeting.welcome')
    })

    it('should return base key for undefined gender', () => {
      expect(buildGenderKey('greeting.welcome', undefined, 'ar')).toBe('greeting.welcome')
    })
  })

  describe('buildGenderKeyFallbacks', () => {
    it('should return only base key for English', () => {
      expect(buildGenderKeyFallbacks('greeting.welcome', 'male', 'en')).toEqual([
        'greeting.welcome'
      ])
      expect(buildGenderKeyFallbacks('greeting.welcome', undefined, 'en')).toEqual([
        'greeting.welcome'
      ])
    })

    it('should return gender key first, then base key for Arabic', () => {
      expect(buildGenderKeyFallbacks('greeting.welcome', 'male', 'ar')).toEqual([
        'greeting.welcome.male',
        'greeting.welcome'
      ])
      expect(buildGenderKeyFallbacks('greeting.welcome', 'female', 'ar')).toEqual([
        'greeting.welcome.female',
        'greeting.welcome'
      ])
    })

    it('should return base key for unsupported gender in Arabic', () => {
      expect(buildGenderKeyFallbacks('greeting.welcome', 'neuter', 'ar')).toEqual([
        'greeting.welcome'
      ])
    })

    it('should return base key for undefined gender in Arabic', () => {
      expect(buildGenderKeyFallbacks('greeting.welcome', undefined, 'ar')).toEqual([
        'greeting.welcome'
      ])
    })

    it('should return gender key first, then base key for Hindi', () => {
      expect(buildGenderKeyFallbacks('greeting.welcome', 'male', 'hi')).toEqual([
        'greeting.welcome.male',
        'greeting.welcome'
      ])
      expect(buildGenderKeyFallbacks('greeting.welcome', 'neuter', 'hi')).toEqual([
        'greeting.welcome.neuter',
        'greeting.welcome'
      ])
    })
  })

  describe('getDefaultGenderForLocale', () => {
    it('should return undefined for English', () => {
      expect(getDefaultGenderForLocale('en')).toBeUndefined()
    })

    it('should return "male" for Arabic', () => {
      expect(getDefaultGenderForLocale('ar')).toBe('male')
    })

    it('should return "male" for Hindi', () => {
      expect(getDefaultGenderForLocale('hi')).toBe('male')
    })
  })

  describe('Constants', () => {
    it('should define genderVariants for all locales', () => {
      expect(genderVariants).toHaveProperty('en')
      expect(genderVariants).toHaveProperty('ar')
      expect(genderVariants).toHaveProperty('hi')
    })

    it('should define defaultGenderForLocale for all locales', () => {
      expect(defaultGenderForLocale).toHaveProperty('en')
      expect(defaultGenderForLocale).toHaveProperty('ar')
      expect(defaultGenderForLocale).toHaveProperty('hi')
    })
  })
})
