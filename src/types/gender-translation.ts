import { GenderType } from '@/lib/gender-rules'
import type { Locale } from '@/lib/i18n'

/**
 * Parameters passed to the translation function
 * Includes support for substitution parameters and gender
 */
export interface TranslationParams {
  /** Substitution parameters for {{param}} placeholders */
  [key: string]: string | number | boolean | undefined
  /** Gender form to use for translations (optional) */
  gender?: GenderType
  /** Count for plural forms (used in Phase 2.1) */
  count?: number
}

/**
 * The translation function type with gender support
 * @param key - The translation key
 * @param params - Optional parameters (substitutions and gender)
 * @returns Translated string with substitutions applied
 */
export type TranslationFunction = (key: string, params?: TranslationParams) => string

/**
 * Return type of useTranslations hook
 */
export interface UseTranslationsReturn {
  /** Translation function */
  t: TranslationFunction
  /** Current locale */
  locale: Locale
  /** Function to change locale */
  setLocale: (locale: Locale) => void
  /** Text direction (ltr or rtl) */
  dir: 'ltr' | 'rtl'
  /** Currently set gender (if any) */
  currentGender?: GenderType
  /** Set default gender for current session */
  setGender?: (gender: GenderType | undefined) => void
}

/**
 * Context value for translation context
 */
export interface TranslationContextValue {
  locale: Locale
  translations: Record<string, string>
  setLocale: (locale: Locale) => void
  currentGender?: GenderType
  setGender?: (gender: GenderType | undefined) => void
}
