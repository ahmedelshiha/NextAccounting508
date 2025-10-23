'use client'

import { createContext, useContext } from 'react'
import enTranslations from '@/app/locales/en.json'
import { flattenTranslations } from '@/lib/translation-utils'
import { GenderType, buildGenderKey } from '@/lib/gender-rules'
import { getPluralForm } from '@/lib/i18n-plural'
import type { TranslationContextValue, TranslationParams } from '@/types/gender-translation'

// Supported locales
export const locales = ['en', 'ar', 'hi'] as const
export type Locale = typeof locales[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Locale configuration
export const localeConfig = {
  en: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    flag: '🇺🇸'
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    flag: '🇸🇦'
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    flag: '🇮🇳'
  }
} as const

// Translation context with gender support
export const TranslationContext = createContext<TranslationContextValue>({
  locale: defaultLocale,
  translations: flattenTranslations(enTranslations as any),
  setLocale: () => {},
  currentGender: undefined,
  setGender: () => {}
})

// Hook to use translations with gender support
export const useTranslations = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider')
  }

  const t = (key: string, params?: TranslationParams) => {
    // Extract gender from params (if provided) or use context gender
    const gender = params?.gender ?? context.currentGender
    const count = typeof params?.count === 'number' ? params.count : undefined

    // Build fallback key chain supporting pluralization and gender
    const fallbacks: string[] = []

    if (typeof count === 'number') {
      // Determine plural form for this locale
      const pluralForm = getPluralForm(context.locale as Locale, count)
      // Try combined plural + gender (e.g., key.one.female)
      if (gender) {
        fallbacks.push(`${key}.${pluralForm}.${gender}`)
      }
      // Try plural-only (e.g., key.one)
      fallbacks.push(`${key}.${pluralForm}`)
    }

    // Gender-only fallback (e.g., key.female)
    if (gender) {
      const genderKey = buildGenderKey(key, gender, context.locale as Locale)
      if (genderKey !== key) fallbacks.push(genderKey)
    }

    // Always include base key as last resort
    fallbacks.push(key)

    // Deduplicate while preserving order
    const keyFallbacks = Array.from(new Set(fallbacks))

    // Find first available translation, fallback to key
    let translation: string = key
    for (const fallbackKey of keyFallbacks) {
      if (fallbackKey in context.translations) {
        translation = context.translations[fallbackKey]
        break
      }
    }

    // Replace parameters in translation (excluding special params)
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        // Skip special parameters (gender, count)
        if (param === 'gender' || param === 'count' || value === undefined) {
          return
        }
        translation = translation.replace(`{{${param}}}`, String(value))
      })
    }

    return translation
  }

  return {
    t,
    locale: context.locale,
    setLocale: context.setLocale,
    dir: localeConfig[context.locale].dir,
    currentGender: context.currentGender,
    setGender: context.setGender
  }
}

// Utility to load translations
export async function loadTranslations(locale: Locale): Promise<Record<string, string>> {
  try {
    const { flattenTranslations } = await import('@/lib/translation-utils')
    const nestedTranslations = await import(`@/app/locales/${locale}.json`)
    // Support both nested namespace structure and flat structure
    const translations = nestedTranslations.default
    const isNested = Object.values(translations).some(
      (value) => typeof value === 'object' && value !== null
    )
    return isNested ? flattenTranslations(translations) : translations
  } catch {
    console.warn(`Failed to load translations for locale: ${locale}`)
    return {}
  }
}

// Utility to detect user's preferred locale
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  
  // Check localStorage first
  const stored = localStorage.getItem('locale') as Locale
  if (stored && locales.includes(stored)) {
    return stored
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0] as Locale
  if (locales.includes(browserLang)) {
    return browserLang
  }
  
  return defaultLocale
}

// Utility to format numbers based on locale
export function formatNumber(
  number: number, 
  locale: Locale, 
  options?: Intl.NumberFormatOptions
): string {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
    hi: 'hi-IN'
  }
  
  return new Intl.NumberFormat(localeMap[locale], options).format(number)
}

// Utility to format currency based on locale
export function formatCurrency(
  amount: number, 
  locale: Locale, 
  currency: string = 'USD'
): string {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
    hi: 'hi-IN'
  }
  
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency
  }).format(amount)
}

// Utility to format dates based on locale
export function formatDate(
  date: Date | string, 
  locale: Locale, 
  options?: Intl.DateTimeFormatOptions
): string {
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
    hi: 'hi-IN'
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat(localeMap[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(dateObj)
}
