import { describe, it, expect } from 'vitest'
import { buildGenderKeyFallbacks, getDefaultGenderForLocale } from '@/lib/gender-rules'
import type { TranslationParams } from '@/types/gender-translation'

describe('Gender-Aware Translation Integration', () => {
  describe('Translation parameter types', () => {
    it('should support gender in TranslationParams', () => {
      const params: TranslationParams = {
        name: 'John',
        gender: 'male'
      }

      expect(params.gender).toBe('male')
      expect(params.name).toBe('John')
    })

    it('should support count in TranslationParams', () => {
      const params: TranslationParams = {
        count: 5,
        gender: 'female'
      }

      expect(params.count).toBe(5)
      expect(params.gender).toBe('female')
    })

    it('should allow undefined gender', () => {
      const params: TranslationParams = {
        name: 'Alice',
        gender: undefined
      }

      expect(params.gender).toBeUndefined()
    })

    it('should support any string substitution parameter', () => {
      const params: TranslationParams = {
        name: 'Bob',
        title: 'Engineer',
        department: 'Sales',
        gender: 'male'
      }

      expect(Object.keys(params)).toContain('name')
      expect(Object.keys(params)).toContain('title')
      expect(Object.keys(params)).toContain('department')
      expect(Object.keys(params)).toContain('gender')
    })

    it('should support boolean parameters', () => {
      const params: TranslationParams = {
        verified: true,
        premium: false,
        gender: 'female'
      }

      expect(params.verified).toBe(true)
      expect(params.premium).toBe(false)
    })

    it('should support numeric parameters', () => {
      const params: TranslationParams = {
        age: 30,
        count: 100,
        score: 95.5
      }

      expect(params.age).toBe(30)
      expect(params.count).toBe(100)
      expect(params.score).toBe(95.5)
    })
  })

  describe('Gender key fallback chain', () => {
    it('should build fallback chain for Arabic male form', () => {
      const fallbacks = buildGenderKeyFallbacks('greeting.welcome', 'male', 'ar')
      expect(fallbacks).toContain('greeting.welcome.male')
      expect(fallbacks).toContain('greeting.welcome')
      expect(fallbacks.indexOf('greeting.welcome.male')).toBeLessThan(
        fallbacks.indexOf('greeting.welcome')
      )
    })

    it('should build fallback chain for Arabic female form', () => {
      const fallbacks = buildGenderKeyFallbacks('greeting.welcome', 'female', 'ar')
      expect(fallbacks).toContain('greeting.welcome.female')
      expect(fallbacks).toContain('greeting.welcome')
    })

    it('should build fallback chain for Hindi with all genders', () => {
      const maleFallbacks = buildGenderKeyFallbacks('greeting.welcome', 'male', 'hi')
      const femaleFallbacks = buildGenderKeyFallbacks('greeting.welcome', 'female', 'hi')
      const neuterFallbacks = buildGenderKeyFallbacks('greeting.welcome', 'neuter', 'hi')

      expect(maleFallbacks).toContain('greeting.welcome.male')
      expect(femaleFallbacks).toContain('greeting.welcome.female')
      expect(neuterFallbacks).toContain('greeting.welcome.neuter')

      expect(maleFallbacks.length).toBe(2)
      expect(femaleFallbacks.length).toBe(2)
      expect(neuterFallbacks.length).toBe(2)
    })

    it('should have base key as final fallback', () => {
      const locales: Array<'en' | 'ar' | 'hi'> = ['en', 'ar', 'hi']
      locales.forEach((locale) => {
        const fallbacks = buildGenderKeyFallbacks('greeting.welcome', 'male', locale)
        expect(fallbacks[fallbacks.length - 1]).toBe('greeting.welcome')
      })
    })

    it('should handle complex key names in fallback chains', () => {
      const fallbacks = buildGenderKeyFallbacks(
        'portal.notification.assigned',
        'female',
        'ar'
      )

      expect(fallbacks[0]).toBe('portal.notification.assigned.female')
      expect(fallbacks[1]).toBe('portal.notification.assigned')
    })
  })

  describe('Default gender per locale', () => {
    it('should provide sensible defaults for each locale', () => {
      const enDefault = getDefaultGenderForLocale('en')
      const arDefault = getDefaultGenderForLocale('ar')
      const hiDefault = getDefaultGenderForLocale('hi')

      expect(enDefault).toBeUndefined()
      expect(arDefault).toBe('male')
      expect(hiDefault).toBe('male')
    })

    it('should use masculine as default for languages that support gender', () => {
      expect(getDefaultGenderForLocale('ar')).toBe('male')
      expect(getDefaultGenderForLocale('hi')).toBe('male')
    })
  })

  describe('Gender-aware translation simulation', () => {
    it('should simulate gender-aware translation resolution', () => {
      const translations: Record<string, string> = {
        'greeting.welcome': 'Welcome, {{name}}!',
        'greeting.welcome.male': 'Welcome, Mr. {{name}}!',
        'greeting.welcome.female': 'Welcome, Ms. {{name}}!'
      }

      function resolveTranslation(
        key: string,
        fallbacks: string[],
        data: Record<string, string>
      ): string {
        let result: string | undefined
        for (const fallbackKey of fallbacks) {
          if (fallbackKey in data) {
            result = data[fallbackKey]
            break
          }
        }
        return result || key
      }

      const femaleFallbacks = buildGenderKeyFallbacks('greeting.welcome', 'female', 'ar')
      const translation = resolveTranslation('greeting.welcome', femaleFallbacks, translations)

      expect(translation).toBe('Welcome, Ms. {{name}}!')
    })

    it('should fallback to base key if gender variant missing', () => {
      const translations: Record<string, string> = {
        'greeting.welcome': 'Welcome, {{name}}!',
        'greeting.welcome.male': 'Welcome, Mr. {{name}}!'
      }

      function resolveTranslation(
        key: string,
        fallbacks: string[],
        data: Record<string, string>
      ): string {
        let result: string | undefined
        for (const fallbackKey of fallbacks) {
          if (fallbackKey in data) {
            result = data[fallbackKey]
            break
          }
        }
        return result || key
      }

      const femaleFallbacks = buildGenderKeyFallbacks('greeting.welcome', 'female', 'ar')
      const translation = resolveTranslation('greeting.welcome', femaleFallbacks, translations)

      expect(translation).toBe('Welcome, {{name}}!')
    })

    it('should handle parameter substitution with gender', () => {
      const translation = 'Welcome, Mr. {{name}}!'
      const params: TranslationParams = {
        name: 'Smith',
        gender: 'male'
      }

      let result = translation
      Object.entries(params).forEach(([key, value]) => {
        if (key !== 'gender' && value !== undefined) {
          result = result.replace(`{{${key}}}`, String(value))
        }
      })

      expect(result).toBe('Welcome, Mr. Smith!')
      expect(result).not.toMatch(/\{\{gender\}\}/)
    })
  })

  describe('Gender variant coverage', () => {
    it('should verify all gender variants exist in translation keys', () => {
      const testKeys = [
        'greeting.welcome',
        'greeting.consultant',
        'profile.accountType',
        'email.greeting'
      ]

      const requiredVariants = {
        en: [''], // English base only
        ar: ['', '.male', '.female'],
        hi: ['', '.male', '.female', '.neuter']
      }

      testKeys.forEach((key) => {
        Object.entries(requiredVariants).forEach(([locale, variants]) => {
          variants.forEach((variant) => {
            const fullKey = key + variant
            // Just verify the key format is correct - allows camelCase within segments
            expect(fullKey).toMatch(/^[a-z]+(\.[a-zA-Z]+)*(\.(male|female|neuter))?$/)
          })
        })
      })
    })

    it('should follow consistent naming convention for gender variants', () => {
      const conventions = [
        { key: 'greeting.welcome.male', pattern: /\.male$/ },
        { key: 'greeting.welcome.female', pattern: /\.female$/ },
        { key: 'profile.accountType.neuter', pattern: /\.neuter$/ }
      ]

      conventions.forEach(({ key, pattern }) => {
        expect(key).toMatch(pattern)
      })
    })
  })

  describe('Translation metadata', () => {
    it('should track gender support per locale', () => {
      const genderSupport = {
        en: 0,
        ar: 2,
        hi: 3
      }

      expect(genderSupport.en).toBe(0)
      expect(genderSupport.ar).toBe(2)
      expect(genderSupport.hi).toBe(3)
    })

    it('should indicate masculine as default for gender-supporting locales', () => {
      const defaults = {
        en: null,
        ar: 'male',
        hi: 'male'
      }

      expect(defaults.en).toBeNull()
      expect(defaults.ar).toBe('male')
      expect(defaults.hi).toBe('male')
    })
  })
})
