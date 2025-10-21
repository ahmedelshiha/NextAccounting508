/**
 * Profile Management Constants
 * Common values and validation utilities
 * Note: Core validation moved to src/schemas/user-profile.ts
 */

import { getCommonTimezones, isValidTimezone, getAvailableTimezones } from '@/schemas/user-profile'

// Re-export from central schema location
export { isValidTimezone, getAvailableTimezones }

export const COMMON_TIMEZONES = getCommonTimezones()

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
]

export const VALID_LANGUAGES = ['en', 'ar', 'hi']

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
