import { z } from 'zod'

/**
 * User Preferences Schema and Types
 * Covers timezone, language, and notification preferences
 *
 * IMPORTANT: PreferencesSchema uses hardcoded language enum for backward compatibility.
 * For dynamic language validation, use createPreferencesSchema() factory function.
 */

// Fallback hardcoded schema (used when language registry unavailable)
export const PreferencesSchema = z.object({
  timezone: z.string().min(1).max(100).default('UTC'),
  preferredLanguage: z.enum(['en', 'ar', 'hi']).default('en'),
  bookingEmailConfirm: z.boolean().default(true),
  bookingEmailReminder: z.boolean().default(true),
  bookingEmailReschedule: z.boolean().default(true),
  bookingEmailCancellation: z.boolean().default(true),
  bookingSmsReminder: z.boolean().default(false),
  bookingSmsConfirmation: z.boolean().default(false),
  reminderHours: z.array(z.number().min(1).max(720)).default([24, 2]),
})

export type UserPreferences = z.infer<typeof PreferencesSchema>

/**
 * Factory function to create PreferencesSchema with dynamic language codes
 * Use this when you have access to the language registry (async context)
 *
 * @param enabledLanguages - Array of enabled language codes from language registry
 * @returns Zod schema with dynamic language enum
 */
export function createPreferencesSchema(enabledLanguages: string[]) {
  if (enabledLanguages.length === 0) {
    console.warn('createPreferencesSchema called with no enabled languages, using fallback')
    return PreferencesSchema
  }

  return z.object({
    timezone: z.string().min(1).max(100).default('UTC'),
    preferredLanguage: z
      .enum(enabledLanguages as [string, ...string[]])
      .default(enabledLanguages[0] || 'en'),
    bookingEmailConfirm: z.boolean().default(true),
    bookingEmailReminder: z.boolean().default(true),
    bookingEmailReschedule: z.boolean().default(true),
    bookingEmailCancellation: z.boolean().default(true),
    bookingSmsReminder: z.boolean().default(false),
    bookingSmsConfirmation: z.boolean().default(false),
    reminderHours: z.array(z.number().min(1).max(720)).default([24, 2]),
  })
}

/**
 * User Profile Schema and Types
 * Core user identity information
 */

export const UserProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  organization: z.string().min(1).max(200).optional(),
  image: z.string().url().optional(),
  emailVerified: z.boolean().optional(),
  role: z.string().optional(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

/**
 * Email Settings Schema
 * Admin-only system-wide email configuration
 */

export const EmailSettingsSchema = z.object({
  senderName: z.string().min(1).max(100).optional(),
  senderEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  signatureHtml: z.string().max(5000).optional(),
  transactionalEnabled: z.boolean().default(true),
  marketingEnabled: z.boolean().default(false),
  complianceBccEnabled: z.boolean().default(false),
})

export type EmailSettings = z.infer<typeof EmailSettingsSchema>

/**
 * SMS Settings Schema
 * Admin-only SMS provider configuration
 */

export const SmsSettingsSchema = z.object({
  provider: z.enum(['none', 'twilio', 'plivo', 'nexmo', 'messagebird']).default('none'),
  senderId: z.string().max(20).optional(),
  transactionalEnabled: z.boolean().default(false),
  marketingEnabled: z.boolean().default(false),
  fallbackToEmail: z.boolean().default(true),
})

export type SmsSettings = z.infer<typeof SmsSettingsSchema>

/**
 * Live Chat Settings Schema
 * Admin-only chat provider configuration
 */

export const LiveChatSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(['none', 'intercom', 'drift', 'zendesk', 'livechat']).default('none'),
  routing: z.enum(['round_robin', 'least_busy', 'first_available', 'manual']).default('round_robin'),
  offlineMessage: z.string().max(1000).optional(),
  workingHoursTimezone: z.string().default('UTC'),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  escalationEmails: z.array(z.string().email()).default([]),
})

export type LiveChatSettings = z.infer<typeof LiveChatSettingsSchema>

/**
 * Notification Digest Schema
 * Admin-only digest configuration
 */

export const NotificationDigestSchema = z.object({
  digestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().default('UTC'),
})

export type NotificationDigest = z.infer<typeof NotificationDigestSchema>

/**
 * Newsletters Settings Schema
 * Admin-only newsletter configuration
 */

export const NewslettersSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  doubleOptIn: z.boolean().default(true),
  defaultSenderName: z.string().max(100).optional(),
  defaultSenderEmail: z.string().email().optional(),
  archiveUrl: z.string().url().optional(),
  topics: z.array(z.string()).default([]),
})

export type NewslettersSettings = z.infer<typeof NewslettersSettingsSchema>

/**
 * Reminder Configuration Schema
 * Individual reminder settings for different entity types
 */

export const ReminderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  offsetHours: z.number().min(1).max(720).default(24),
  templateId: z.string().optional(),
  channels: z.array(z.enum(['email', 'sms', 'push'])).default(['email']),
})

export type ReminderConfig = z.infer<typeof ReminderConfigSchema>

/**
 * Type-safe factory functions for complex Zod schema defaults
 * These ensure proper type inference for array and union types
 */

function createEmailSettings(): z.infer<typeof EmailSettingsSchema> {
  return {
    transactionalEnabled: true,
    marketingEnabled: false,
    complianceBccEnabled: false,
  }
}

function createSmsSettings(): z.infer<typeof SmsSettingsSchema> {
  return {
    provider: 'none' as 'none' | 'twilio' | 'plivo' | 'nexmo' | 'messagebird',
    transactionalEnabled: false,
    marketingEnabled: false,
    fallbackToEmail: true,
  }
}

function createLiveChatSettings(): z.infer<typeof LiveChatSettingsSchema> {
  return {
    enabled: false,
    provider: 'none' as 'none' | 'intercom' | 'drift' | 'zendesk' | 'livechat',
    routing: 'round_robin' as 'round_robin' | 'least_busy' | 'first_available' | 'manual',
    workingHoursTimezone: 'UTC',
    escalationEmails: [],
  }
}

function createNotificationDigest(): z.infer<typeof NotificationDigestSchema> {
  return {
    timezone: 'UTC',
  }
}

function createNewslettersSettings(): z.infer<typeof NewslettersSettingsSchema> {
  return {
    enabled: false,
    doubleOptIn: true,
    topics: [],
  }
}

function createReminderConfig(): z.infer<typeof ReminderConfigSchema> {
  return {
    enabled: true,
    offsetHours: 24,
    channels: ['email'] as ('email' | 'sms' | 'push')[],
  }
}

function createRemindersSettings(): z.infer<typeof RemindersSettingsSchema> {
  return {
    bookings: {
      enabled: true,
      offsetHours: 24,
      channels: ['email'] as ('email' | 'sms' | 'push')[],
    },
    invoices: {
      enabled: true,
      offsetHours: 24,
      channels: ['email'] as ('email' | 'sms' | 'push')[],
    },
    tasks: {
      enabled: true,
      offsetHours: 24,
      channels: ['email'] as ('email' | 'sms' | 'push')[],
    },
  }
}

/**
 * Reminders Settings Schema
 * Admin-only reminders configuration for bookings, invoices, tasks
 */

export const RemindersSettingsSchema = z.object({
  bookings: ReminderConfigSchema,
  invoices: ReminderConfigSchema,
  tasks: ReminderConfigSchema,
})

export type RemindersSettings = z.infer<typeof RemindersSettingsSchema>

/**
 * Complete Communication Settings Schema
 * Combines all admin-only communication channel configurations
 */

export const CommunicationSettingsSchema = z.object({
  email: EmailSettingsSchema.default(createEmailSettings),
  sms: SmsSettingsSchema.default(createSmsSettings),
  liveChat: LiveChatSettingsSchema.default(createLiveChatSettings),
  notificationDigest: NotificationDigestSchema.default(createNotificationDigest),
  newsletters: NewslettersSettingsSchema.default(createNewslettersSettings),
  reminders: RemindersSettingsSchema.default(createRemindersSettings),
})

export type CommunicationSettings = z.infer<typeof CommunicationSettingsSchema>

/**
 * Generic API Response Wrapper
 * Standardized response format for all API routes
 */

export const ApiResponseSchema = z.object({
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

export type ApiResponse<T = unknown> = {
  data?: T
  error?: string
  message?: string
}

/**
 * Error Response Schema
 * Standardized error format for all API routes
 */

export const ErrorResponseSchema = z.object({
  error: z.string(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

/**
 * Edit Profile Request Schema
 * For ProfileManagementPanel EditableField component
 */

export const EditProfileRequestSchema = z.object({
  field: z.enum(['name', 'email', 'organization']),
  value: z.string().min(1).max(200),
})

export type EditProfileRequest = z.infer<typeof EditProfileRequestSchema>

/**
 * Helper function: Validate timezone using Intl API
 */

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Helper function: Get all available timezones
 * Falls back to common timezones if Intl.supportedValuesOf not available
 */

export function getAvailableTimezones(): string[] {
  if (typeof (Intl as any).supportedValuesOf === 'function') {
    try {
      return ((Intl as any).supportedValuesOf('timeZone') as string[]).sort()
    } catch {
      return getCommonTimezones()
    }
  }
  return getCommonTimezones()
}

/**
 * Common timezones fallback list
 */

export function getCommonTimezones(): string[] {
  return [
    'UTC',
    'GMT',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Adak',
    'America/Toronto',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'America/Argentina/Buenos_Aires',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Vienna',
    'Europe/Prague',
    'Europe/Warsaw',
    'Europe/Moscow',
    'Europe/Istanbul',
    'Europe/Athens',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Asia/Dubai',
    'Asia/Qatar',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Pacific/Auckland',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
  ]
}
