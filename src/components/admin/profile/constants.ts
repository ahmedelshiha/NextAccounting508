/**
 * Profile Management Constants
 * Common timezone list and validation utilities
 */

export const COMMON_TIMEZONES = [
  'UTC',
  'US/Eastern',
  'US/Central',
  'US/Mountain',
  'US/Pacific',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

/**
 * Validate timezone using Intl API (IANA timezone database)
 * More robust than hardcoded list
 */
export function isValidTimezone(tz: string): boolean {
  try {
    // If Intl API doesn't throw, timezone is valid
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch (e) {
    return false
  }
}

/**
 * Get all available timezones (if supported by environment)
 * Falls back to common timezones if not available
 */
export function getAvailableTimezones(): string[] {
  // Check if Intl.supportedValuesOf is available (Node.js 18+, modern browsers)
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return (Intl.supportedValuesOf as any)('timeZone') as string[]
    } catch {
      // Fallback if not supported
      return COMMON_TIMEZONES
    }
  }
  return COMMON_TIMEZONES
}

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
]

export const VALID_LANGUAGES = ['en', 'ar', 'hi']

/**
 * Reminder hours configuration
 */
export const REMINDER_HOURS = [24, 12, 6, 2]

/**
 * Valid reminder hours range: 1-720 hours (1 minute to 30 days)
 */
export const REMINDER_HOURS_MIN = 1
export const REMINDER_HOURS_MAX = 720
