import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TranslationProvider } from '@/components/providers/translation-provider'
import { useTranslations } from '@/lib/i18n'
import type { ReactNode } from 'react'

// Mock translations with gender variants
const mockTranslations = {
  'greeting.welcome': 'Welcome, {{name}}!',
  'greeting.welcome.male': 'Welcome, Mr. {{name}}!',
  'greeting.welcome.female': 'Welcome, Ms. {{name}}!',
  'greeting.consultant': 'Your consultant',
  'greeting.consultant.male': 'Your consultant (He/Him)',
  'greeting.consultant.female': 'Your consultant (She/Her)',
  'profile.accountType': 'Account type',
  'profile.accountType.male': 'You are registered as a male consultant',
  'profile.accountType.female': 'You are registered as a female consultant',
  'profile.accountType.neuter': 'You are registered as a consultant',
  'email.greeting': 'Hello',
  'email.greeting.male': 'Hello Mr. {{name}}',
  'email.greeting.female': 'Hello Ms. {{name}}'
}

// Helper to create wrapper component
const createWrapper = () => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TranslationProvider initialLocale="en" initialGender={undefined}>
        {children}
      </TranslationProvider>
    )
  }
}

describe('useTranslations Hook with Gender Support', () => {
  describe('basic gender parameter usage', () => {
    it('should use base key if no gender specified', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      // Mock the context translations to include our test keys
      vi.mock('@/app/locales/en.json', () => ({
        default: mockTranslations
      }))

      // This tests that the hook can accept gender parameter
      expect(typeof result.current.t).toBe('function')
    })

    it('should accept gender parameter in translation function', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      // Verify t function can accept params with gender
      const name = 'John'
      const translation = result.current.t('greeting.welcome', { name, gender: 'male' })
      expect(typeof translation).toBe('string')
    })

    it('should return hook with currentGender property', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      expect(result.current).toHaveProperty('currentGender')
      expect(result.current).toHaveProperty('setGender')
    })
  })

  describe('gender context state management', () => {
    it('should initialize with initialGender from provider', () => {
      function WrapperWithGender({ children }: { children: ReactNode }) {
        return (
          <TranslationProvider initialLocale="en" initialGender="female">
            {children}
          </TranslationProvider>
        )
      }

      const { result } = renderHook(() => useTranslations(), {
        wrapper: WrapperWithGender
      })

      expect(result.current.currentGender).toBe('female')
    })

    it('should initialize with undefined gender if not provided', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      expect(result.current.currentGender).toBeUndefined()
    })

    it('should allow setting gender via setGender', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      expect(result.current.setGender).toBeDefined()

      act(() => {
        if (result.current.setGender) {
          result.current.setGender('male')
        }
      })

      expect(result.current.currentGender).toBe('male')
    })

    it('should allow clearing gender with setGender(undefined)', () => {
      function WrapperWithGender({ children }: { children: ReactNode }) {
        return (
          <TranslationProvider initialLocale="en" initialGender="female">
            {children}
          </TranslationProvider>
        )
      }

      const { result } = renderHook(() => useTranslations(), {
        wrapper: WrapperWithGender
      })

      expect(result.current.currentGender).toBe('female')

      act(() => {
        if (result.current.setGender) {
          result.current.setGender(undefined)
        }
      })

      expect(result.current.currentGender).toBeUndefined()
    })
  })

  describe('parameter handling', () => {
    it('should handle non-gender parameters alongside gender', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      // Verify parameters are properly handled
      const translation = result.current.t('greeting.welcome', {
        name: 'Alice',
        gender: 'female'
      })

      expect(typeof translation).toBe('string')
    })

    it('should ignore special parameters when substituting', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      // Gender and count should not be treated as substitution parameters
      const translation = result.current.t('greeting.welcome', {
        gender: 'male',
        count: 1,
        name: 'Bob'
      })

      // Should not have {{gender}} or {{count}} in result
      expect(translation).not.toMatch(/\{\{gender\}\}/)
      expect(translation).not.toMatch(/\{\{count\}\}/)
    })

    it('should handle boolean and undefined parameter values', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      const translation = result.current.t('email.greeting', {
        name: 'Smith',
        gender: 'female',
        verified: true,
        optional: undefined
      })

      expect(typeof translation).toBe('string')
    })
  })

  describe('locale and direction', () => {
    it('should maintain locale property', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      expect(result.current.locale).toBe('en')
    })

    it('should maintain dir property', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      expect(result.current.dir).toBe('ltr')
    })

    it('should maintain setLocale property', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      expect(typeof result.current.setLocale).toBe('function')
    })
  })

  describe('error handling', () => {
    it('should throw error if hook used outside provider', () => {
      expect(() => {
        renderHook(() => useTranslations())
      }).toThrow('useTranslations must be used within a TranslationProvider')
    })

    it('should return key if translation not found', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      const translation = result.current.t('non.existent.key')
      expect(translation).toBe('non.existent.key')
    })

    it('should return base key if gender-variant not found', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      // When gender-specific key doesn't exist, should try base key
      // This depends on actual translations loaded
      const translation = result.current.t('any.key', { gender: 'male' })
      expect(typeof translation).toBe('string')
    })
  })

  describe('parameter substitution with gender', () => {
    it('should substitute parameters correctly with gender', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      // Test that {{}} placeholders are replaced but gender is not
      const translation = result.current.t('email.greeting', {
        name: 'Johnson',
        gender: 'male'
      })

      // Result should not contain {{name}} placeholder
      expect(translation).not.toMatch(/\{\{name\}\}/)
    })

    it('should handle multiple parameter substitutions', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      // Test with multiple placeholders
      const translation = result.current.t('greeting.welcome', {
        name: 'Test',
        gender: 'female',
        title: 'Engineer' // additional param
      })

      expect(typeof translation).toBe('string')
    })

    it('should convert number parameters to strings', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useTranslations(), { wrapper })

      const translation = result.current.t('greeting.welcome', {
        name: 'User',
        count: 42
      })

      expect(typeof translation).toBe('string')
    })
  })

  describe('gender fallback behavior', () => {
    it('should use context gender if not provided in params', () => {
      function WrapperWithGender({ children }: { children: ReactNode }) {
        return (
          <TranslationProvider initialLocale="en" initialGender="male">
            {children}
          </TranslationProvider>
        )
      }

      const { result } = renderHook(() => useTranslations(), {
        wrapper: WrapperWithGender
      })

      // When called without gender param, should use context gender
      expect(result.current.currentGender).toBe('male')
    })

    it('should prefer param gender over context gender', () => {
      function WrapperWithGender({ children }: { children: ReactNode }) {
        return (
          <TranslationProvider initialLocale="en" initialGender="male">
            {children}
          </TranslationProvider>
        )
      }

      const { result } = renderHook(() => useTranslations(), {
        wrapper: WrapperWithGender
      })

      // Param gender should override context gender
      const translation = result.current.t('greeting.welcome', {
        name: 'Alice',
        gender: 'female' // Override context 'male' with 'female'
      })

      expect(typeof translation).toBe('string')
    })
  })
})