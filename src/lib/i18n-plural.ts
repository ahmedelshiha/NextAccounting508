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
  // Normalize to integer for plural rules
  const n = Math.abs(Math.floor(count))

  switch (locale) {
    case 'en':
    case 'hi':
      // English & Hindi: one vs other
      return n === 1 ? 'one' : 'other'
    case 'ar':
      // Simplified Arabic rules (CLDR has more cases)
      if (n === 0) return 'zero'
      if (n === 1) return 'one'
      if (n === 2) return 'two'
      if (n % 100 >= 3 && n % 100 <= 10) return 'few'
      if (n % 100 >= 11 && n % 100 <= 99) return 'many'
      return 'other'
    default:
      return n === 1 ? 'one' : 'other'
  }
}
