/**
 * Pluralization helpers for a small set of supported locales.
 * Implements CLDR-like rules for en, hi, ar sufficient for our app's needs.
 */
import type { Locale } from './i18n'

/**
 * Returns plural form key for given locale and count.
 * Common forms: 'zero', 'one', 'two', 'few', 'many', 'other'
 */
export function getPluralForm(locale: Locale, count: number): string {
  // For CLDR pluralization rules, use the absolute value but preserve decimal and sign info
  // If the count is not exactly 1 (including if it's a decimal), it's plural
  const n = Math.abs(count)
  const isExactlyOne = Number.isInteger(count) && count === 1

  switch (locale) {
    case 'en':
    case 'hi':
      // English & Hindi: one vs other
      // Only singular form for exactly 1, everything else is plural
      return isExactlyOne ? 'one' : 'other'
    case 'ar':
      // Simplified Arabic rules (CLDR has more cases)
      // For Arabic, we work with the absolute integer value
      const nAr = Math.floor(n)
      if (nAr === 0) return 'zero'
      if (nAr === 1) return 'one'
      if (nAr === 2) return 'two'
      if (nAr % 100 >= 3 && nAr % 100 <= 10) return 'few'
      if (nAr % 100 >= 11 && nAr % 100 <= 99) return 'many'
      return 'other'
    default:
      return isExactlyOne ? 'one' : 'other'
  }
}
