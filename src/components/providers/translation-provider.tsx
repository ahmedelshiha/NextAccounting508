'use client'

import { useEffect, useState, ReactNode } from 'react'
import { Locale, defaultLocale, loadTranslations, detectLocale, TranslationContext } from '@/lib/i18n'

interface TranslationProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function TranslationProvider({ children, initialLocale }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load translations when locale changes
  useEffect(() => {
    async function loadLocaleTranslations() {
      setIsLoading(true)
      try {
        const newTranslations = await loadTranslations(locale)
        setTranslations(newTranslations)
      } catch (error) {
        console.error('Failed to load translations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLocaleTranslations()
  }, [locale])

  // Detect and set initial locale on client side
  useEffect(() => {
    if (!initialLocale && typeof window !== 'undefined') {
      const detectedLocale = detectLocale()
      if (detectedLocale !== locale) {
        setLocaleState(detectedLocale)
      }
    }
  }, [initialLocale, locale])

  // Update locale and persist to localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
      // Update document direction for RTL languages
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = newLocale
    }
  }

  // Set initial document attributes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = locale
    }
  }, [locale])

  const contextValue = {
    locale,
    translations,
    setLocale
  }

  // Show loading state while translations are loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}
