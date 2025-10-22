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
  // For CLDR pluralization rules, floor the count to handle decimals
  // then use absolute value for the actual plural rule logic
  const n = Math.floor(Math.abs(count))

  switch (locale) {
    case 'en':
    case 'hi':
      // English & Hindi: one vs other
      return n === 1 ? 'one' : 'other'
    case 'ar':
      // Simplified Arabic rules (CLDR has more cases)
      // For negative counts, use modulo arithmetic on abs value
      if (n === 0) return 'zero'
      if (n === 1) return 'one'
      if (n === 2) return 'two'
      // Use modulo 100 for the rules
      const mod100 = n % 100
      if (mod100 >= 3 && mod100 <= 10) return 'few'
      if (mod100 >= 11 && mod100 <= 99) return 'many'
      return 'other'
    default:
      return n === 1 ? 'one' : 'other'
  }
}
