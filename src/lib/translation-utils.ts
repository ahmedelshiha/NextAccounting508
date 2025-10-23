/**
 * Utilities for handling nested namespace translation structures.
 * Converts between nested objects and flat dot-notation keys.
 */

/**
 * Flattens a nested translation object to dot-notation keys.
 *
 * @example
 * ```typescript
 * const nested = {
 *   nav: { home: 'Home', about: 'About' },
 *   greeting: { welcome: 'Welcome' }
 * }
 *
 * flattenTranslations(nested)
 * // Returns:
 * // {
 * //   'nav.home': 'Home',
 * //   'nav.about': 'About',
 * //   'greeting.welcome': 'Welcome'
 * // }
 * ```
 *
 * @param obj - The nested translation object
 * @param prefix - Current prefix (used in recursion)
 * @returns Flattened object with dot-notation keys
 */
export function flattenTranslations(
  obj: any,
  prefix: string = ''
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue
    }

    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key

    // If value is a string, add it to results
    if (typeof value === 'string') {
      result[newKey] = value
    }
    // If value is an object, recursively flatten
    else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenTranslations(value, newKey))
    }
    // Skip other types (arrays, booleans, numbers, etc.)
  }

  return result
}

/**
 * Validates that all locale files have the same keys (with appropriate gender variants).
 * Used for testing and CI/CD validation.
 *
 * @param locales - Map of locale codes to flat translation objects
 * @param supportedGenders - Map of locale codes to supported gender forms
 * @returns Array of validation errors (empty if valid)
 */
export function validateTranslationParity(
  locales: Record<string, Record<string, string>>,
  supportedGenders?: Record<string, string[]>
): string[] {
  const errors: string[] = []
  const localeNames = Object.keys(locales)

  if (localeNames.length === 0) {
    return ['No locales provided']
  }

  // Get reference locale (usually 'en')
  const referenceLocale = localeNames[0]
  const referenceKeys = new Set(Object.keys(locales[referenceLocale]))

  // Check each locale
  localeNames.forEach((locale) => {
    const localeKeys = new Set(Object.keys(locales[locale]))
    const genders = supportedGenders?.[locale] || []

    // Find keys in reference but not in this locale
    referenceKeys.forEach((key) => {
      // Skip gender-specific keys that might not be in all locales
      const isGenderSpecific = genders.some((gender) => key.endsWith(`.${gender}`))

      if (!localeKeys.has(key) && !isGenderSpecific) {
        errors.push(`[${locale}] Missing key: "${key}"`)
      }
    })

    // Find keys in this locale but not in reference
    localeKeys.forEach((key) => {
      const baseKey = genders.reduce(
        (acc, gender) => acc.replace(new RegExp(`\\.${gender}$`), ''),
        key
      )

      if (!referenceKeys.has(key) && !referenceKeys.has(baseKey)) {
        errors.push(`[${locale}] Extra/orphaned key: "${key}"`)
      }
    })
  })

  return errors
}

/**
 * Extracts base key from a potentially gender-variant key.
 *
 * @example
 * ```typescript
 * getBaseKey('greeting.welcome.male', ['male', 'female'])
 * // Returns: 'greeting.welcome'
 * ```
 *
 * @param key - The translation key (may include gender suffix)
 * @param genderForms - Array of gender form suffixes to remove
 * @returns Base key without gender suffix
 */
export function getBaseKey(key: string, genderForms: string[] = []): string {
  let result = key
  genderForms.forEach((gender) => {
    const suffix = `.${gender}`
    if (result.endsWith(suffix)) {
      result = result.slice(0, -suffix.length)
    }
  })
  return result
}

/**
 * Extracts all base keys from a flat translation object.
 * Useful for building key indexes and validating coverage.
 *
 * @param translations - Flat translation object with dot-notation keys
 * @param genderForms - Array of gender form suffixes
 * @returns Set of unique base keys
 */
export function extractBaseKeys(
  translations: Record<string, string>,
  genderForms: string[] = ['male', 'female', 'neuter']
): Set<string> {
  const baseKeys = new Set<string>()

  Object.keys(translations).forEach((key) => {
    const baseKey = getBaseKey(key, genderForms)
    baseKeys.add(baseKey)
  })

  return baseKeys
}

/**
 * Validates that nested object structure is valid for flattening.
 * Ensures no mixing of string values and nested objects at same level.
 *
 * @param obj - The object to validate
 * @param path - Current path (for error messages)
 * @returns Array of validation errors (empty if valid)
 */
export function validateNestedStructure(obj: any, path: string = 'root'): string[] {
  const errors: string[] = []

  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return errors
  }

  Object.entries(obj).forEach(([key, value]) => {
    const currentPath = path ? `${path}.${key}` : key

    if (value === null) {
      errors.push(`[${currentPath}] Value cannot be null`)
      return
    }

    if (Array.isArray(value)) {
      errors.push(`[${currentPath}] Arrays not supported in translation structure`)
      return
    }

    if (typeof value === 'string') {
      // String value is fine
      return
    }

    if (typeof value === 'object') {
      // Recursively validate nested object
      errors.push(...validateNestedStructure(value, currentPath))
      return
    }

    // Other types (number, boolean, etc.) are not allowed
    errors.push(
      `[${currentPath}] Invalid value type "${typeof value}" (must be string or object)`
    )
  })

  return errors
}

/**
 * Gets translation coverage percentage for a locale.
 * Useful for tracking how many keys are actually translated.
 *
 * @param localeTranslations - Flat translation object for the locale
 * @param referenceTranslations - Flat translation object for reference locale (usually 'en')
 * @param genderForms - Array of gender form suffixes to consider
 * @returns Coverage percentage (0-100)
 */
export function getTranslationCoverage(
  localeTranslations: Record<string, string>,
  referenceTranslations: Record<string, string>,
  genderForms: string[] = ['male', 'female', 'neuter']
): number {
  const referenceBaseKeys = extractBaseKeys(referenceTranslations, genderForms)
  const localeBaseKeys = extractBaseKeys(localeTranslations, genderForms)

  if (referenceBaseKeys.size === 0) {
    return 100
  }

  let translatedCount = 0
  referenceBaseKeys.forEach((key) => {
    if (localeBaseKeys.has(key)) {
      translatedCount++
    }
  })

  return Math.round((translatedCount / referenceBaseKeys.size) * 100)
}

/**
 * Finds translation keys that are missing from a locale.
 *
 * @param localeTranslations - Flat translation object for the locale
 * @param referenceTranslations - Flat translation object for reference locale
 * @param genderForms - Array of gender form suffixes
 * @returns Array of missing base keys
 */
export function findMissingTranslations(
  localeTranslations: Record<string, string>,
  referenceTranslations: Record<string, string>,
  genderForms: string[] = ['male', 'female', 'neuter']
): string[] {
  const referenceBaseKeys = extractBaseKeys(referenceTranslations, genderForms)
  const localeBaseKeys = extractBaseKeys(localeTranslations, genderForms)

  const missing: string[] = []
  referenceBaseKeys.forEach((key) => {
    if (!localeBaseKeys.has(key)) {
      missing.push(key)
    }
  })

  return missing.sort()
}

/**
 * Finds orphaned translation keys (present in locale but not in reference).
 *
 * @param localeTranslations - Flat translation object for the locale
 * @param referenceTranslations - Flat translation object for reference locale
 * @param genderForms - Array of gender form suffixes
 * @returns Array of orphaned keys
 */
export function findOrphanedTranslations(
  localeTranslations: Record<string, string>,
  referenceTranslations: Record<string, string>,
  genderForms: string[] = ['male', 'female', 'neuter']
): string[] {
  const referenceBaseKeys = extractBaseKeys(referenceTranslations, genderForms)
  const localeBaseKeys = extractBaseKeys(localeTranslations, genderForms)

  const orphaned: string[] = []
  localeBaseKeys.forEach((key) => {
    if (!referenceBaseKeys.has(key)) {
      orphaned.push(key)
    }
  })

  return orphaned.sort()
}
