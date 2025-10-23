/**
 * Locale mapping utility
 * Maps short language codes to BCP47 locale strings for proper date/time formatting
 */

type LanguageCode = 'en' | 'ar' | 'hi'
type BCP47Locale = string

/**
 * Map short language codes to BCP47 locale strings
 * Used for proper Intl API formatting in emails, reminders, etc.
 */
const languageToBCP47Map: Record<LanguageCode, BCP47Locale> = {
  en: 'en-US',
  ar: 'ar-SA',
  hi: 'hi-IN',
}

/**
 * Convert a short language code to a BCP47 locale string
 * @param languageCode - Short language code (e.g., 'en', 'ar', 'hi')
 * @returns BCP47 locale string suitable for Intl API (e.g., 'en-US', 'ar-SA', 'hi-IN')
 * @default 'en-US' if language code is not recognized
 */
export function getBCP47Locale(languageCode: string | undefined | null): BCP47Locale {
  if (!languageCode) return 'en-US'
  
  const normalized = languageCode.toLowerCase().trim()
  
  // If it's already a BCP47 locale (contains hyphen), return as-is
  if (normalized.includes('-')) {
    return normalized
  }
  
  // Map short code to BCP47
  const mapped = languageToBCP47Map[normalized as LanguageCode]
  return mapped || 'en-US'
}

/**
 * Get supported language codes
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): LanguageCode[] {
  return Object.keys(languageToBCP47Map) as LanguageCode[]
}

/**
 * Type-safe language validation
 * @param code - Language code to validate
 * @returns true if code is a supported language code
 */
export function isSupportedLanguage(code: string | undefined | null): code is LanguageCode {
  if (!code) return false
  return code in languageToBCP47Map
}
