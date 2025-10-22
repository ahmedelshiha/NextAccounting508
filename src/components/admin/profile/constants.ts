/**
 * Profile Management Constants
 * Common values and validation utilities
 * Note: Core validation moved to src/schemas/user-profile.ts
 * Languages now loaded from language registry (data-driven)
 */

import { getCommonTimezones, isValidTimezone, getAvailableTimezones } from '@/schemas/user-profile'

// Re-export from central schema location
export { isValidTimezone, getAvailableTimezones }

export const COMMON_TIMEZONES = getCommonTimezones()

/**
 * Fallback languages (used when language registry unavailable)
 * These match the defaults in src/lib/language-registry.ts
 */
export const FALLBACK_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
]

/**
 * DEPRECATED: Use getLanguagesForUI() instead
 * Kept for backward compatibility
 */
export const LANGUAGES = FALLBACK_LANGUAGES

/**
 * DEPRECATED: Use getEnabledLanguageCodes() from language-registry.ts instead
 * Kept for backward compatibility
 */
export const VALID_LANGUAGES = ['en', 'ar', 'hi']

/**
 * Get languages for UI dropdown
 * This function should be called server-side and passed to client
 * Loads from language registry if available, falls back to hardcoded list
 */
export async function getLanguagesForUI() {
  try {
    const { getEnabledLanguages } = await import('@/lib/language-registry')
    const enabled = await getEnabledLanguages()
    return enabled.map((lang) => ({
      code: lang.code,
      label: lang.nativeName,
    }))
  } catch (error) {
    console.warn('Failed to load languages from registry, using fallback', error)
    return FALLBACK_LANGUAGES
  }
}

/**
 * Profile fields configuration for EditableField component
 */
export const PROFILE_FIELDS = [
  {
    key: 'name',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    verified: false,
    masked: false,
    fieldType: 'text' as const,
  },
  {
    key: 'email',
    label: 'Email',
    placeholder: 'Enter your email address',
    verified: false,
    masked: false,
    fieldType: 'email' as const,
  },
  {
    key: 'organization',
    label: 'Organization',
    placeholder: 'Enter your organization name',
    verified: false,
    masked: false,
    fieldType: 'text' as const,
  },
]

/**
 * Reminder hours configuration
 */
export const REMINDER_HOURS = [24, 12, 6, 2]

/**
 * Valid reminder hours range: 1-720 hours (1 minute to 30 days)
 */
export const REMINDER_HOURS_MIN = 1
export const REMINDER_HOURS_MAX = 720
