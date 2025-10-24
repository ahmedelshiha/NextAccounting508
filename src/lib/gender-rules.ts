import { Locale } from '@/lib/i18n'

/**
 * Gender types supported per locale
 * - en: English (no gender variation)
 * - ar: Arabic (masculine, feminine)
 * - hi: Hindi (masculine, feminine, neuter)
 */
export type GenderType = 'male' | 'female' | 'neuter'

/**
 * Define gender variants for each locale
 * Maps locale to supported gender forms
 */
export const genderVariants: Record<Locale, GenderType[]> = {
  en: [], // English doesn't support grammatical gender
  ar: ['male', 'female'], // Arabic supports masculine/feminine
  hi: ['male', 'female', 'neuter'] // Hindi supports all three
}

/**
 * Gender form names that match translation key suffixes
 * Example: "greeting.welcome.male" or "greeting.welcome.masculine"
 */
export const genderFormMap: Record<GenderType, string> = {
  male: 'male',
  female: 'female',
  neuter: 'neuter'
}

/**
 * Determine if a locale supports gender-specific translations
 * @param locale - The locale to check
 * @returns true if locale has gender variants
 */
export function supportsGender(locale: Locale): boolean {
  return genderVariants[locale].length > 0
}

/**
 * Get all supported gender forms for a locale
 * @param locale - The locale
 * @returns Array of supported gender types
 */
export function getGenderFormsForLocale(locale: Locale): GenderType[] {
  return genderVariants[locale]
}

/**
 * Check if a gender is valid for a specific locale
 * @param gender - The gender to check
 * @param locale - The locale
 * @returns true if gender is supported
 */
export function isValidGenderForLocale(gender: GenderType | undefined, locale: Locale): boolean {
  if (!gender) return true // undefined is always valid (uses fallback)
  return genderVariants[locale].includes(gender)
}

/**
 * Build a gender-specific translation key
 * Takes a base key and appends the gender form
 * Example: buildGenderKey("greeting.welcome", "male", "ar") => "greeting.welcome.male"
 * 
 * @param baseKey - The base translation key (e.g., "greeting.welcome")
 * @param gender - The gender form
 * @param locale - The locale (for validation)
 * @returns The gender-specific key, or the base key if gender not supported
 */
export function buildGenderKey(baseKey: string, gender: GenderType | undefined, locale: Locale): string {
  if (!gender || !isValidGenderForLocale(gender, locale)) {
    return baseKey
  }
  
  const genderForm = genderFormMap[gender]
  return `${baseKey}.${genderForm}`
}

/**
 * Get translation key fallback chain for a gender-specific lookup
 * Returns keys in order of preference, allowing for graceful fallback
 * 
 * Example (ar):
 *   buildGenderKeyFallbacks("greeting.welcome", "female", "ar")
 *   => ["greeting.welcome.female", "greeting.welcome", "greeting.welcome"]
 * 
 * Example (en):
 *   buildGenderKeyFallbacks("greeting.welcome", "male", "en")
 *   => ["greeting.welcome"]
 * 
 * @param baseKey - The base translation key
 * @param gender - The gender form
 * @param locale - The locale
 * @returns Array of keys to try in order
 */
export function buildGenderKeyFallbacks(
  baseKey: string,
  gender: GenderType | undefined,
  locale: Locale
): string[] {
  const fallbacks: string[] = []
  
  if (!supportsGender(locale) || !gender) {
    // For locales without gender support, just return base key
    return [baseKey]
  }
  
  // First try the gender-specific form
  const genderKey = buildGenderKey(baseKey, gender, locale)
  if (genderKey !== baseKey) {
    fallbacks.push(genderKey)
  }
  
  // Always fall back to the base key
  fallbacks.push(baseKey)
  
  return fallbacks
}

/**
 * Default gender per locale (for when gender is not specified)
 * Used as a sensible default when gender context is missing
 */
export const defaultGenderForLocale: Record<Locale, GenderType | null> = {
  en: null, // English doesn't use gender
  ar: 'male', // Arabic defaults to masculine
  hi: 'male' // Hindi defaults to masculine
}

/**
 * Get appropriate gender for a locale when gender is undefined
 * Returns the default gender or undefined if not applicable
 * 
 * @param locale - The locale
 * @returns Default gender, or undefined if locale doesn't support gender
 */
export function getDefaultGenderForLocale(locale: Locale): GenderType | undefined {
  return defaultGenderForLocale[locale] || undefined
}

/**
 * Locale-specific gender metadata
 * Provides context-specific information about how gender works in each language
 */
export const genderMetadata: Record<Locale, { description: string; notes?: string }> = {
  en: {
    description: 'English has no grammatical gender; gender forms are not used',
    notes: 'Gender parameter is ignored in English'
  },
  ar: {
    description: 'Arabic has masculine and feminine forms',
    notes: 'Adjectives, verbs, and some nouns change based on gender; dual forms exist but simplified to masculine/feminine'
  },
  hi: {
    description: 'Hindi has masculine, feminine, and neuter forms',
    notes: 'Hindi adjectives and verbs agree with the gender of the noun they modify'
  }
}
