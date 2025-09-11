import { createContext, useContext } from 'react'

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

// Translation context
export const TranslationContext = createContext<{
  locale: Locale
  translations: Record<string, string>
  setLocale: (locale: Locale) => void
}>({
  locale: defaultLocale,
  translations: {},
  setLocale: () => {}
})

// Hook to use translations
export const useTranslations = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider')
  }
  
  const t = (key: string, params?: Record<string, string | number>) => {
    let translation = context.translations[key] || key
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value))
      })
    }
    
    return translation
  }
  
  return {
    t,
    locale: context.locale,
    setLocale: context.setLocale,
    dir: localeConfig[context.locale].dir
  }
}

// Utility to load translations
export async function loadTranslations(locale: Locale): Promise<Record<string, string>> {
  try {
    const translations = await import(`@/app/locales/${locale}.json`)
    return translations.default
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
