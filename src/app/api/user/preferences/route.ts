import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PreferencesSchema, isValidTimezone, createPreferencesSchema } from '@/schemas/user-profile'
import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'
import * as Sentry from '@sentry/nextjs'
import { getEnabledLanguageCodes } from '@/lib/language-registry'

/**
 * Sanitize request/response payloads for logging (remove PII)
 * Allows only non-sensitive fields
 */
function sanitizePayloadForLogging(payload: Record<string, any>): Record<string, any> {
  const allowedFields = ['timezone', 'preferredLanguage', 'bookingEmailConfirm', 'bookingEmailReminder', 'bookingEmailReschedule', 'bookingEmailCancellation', 'bookingSmsReminder', 'bookingSmsConfirmation']
  const sanitized: Record<string, any> = {}
  for (const field of allowedFields) {
    if (field in payload) {
      sanitized[field] = payload[field]
    }
  }
  return sanitized
}

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    let ctx
    try {
      ctx = requireTenantContext()
    } catch (contextError) {
      console.error('Preferences GET: Failed to get tenant context', {
        error: contextError instanceof Error ? contextError.message : String(contextError),
      })
      return NextResponse.json({ error: 'Tenant context error' }, { status: 500 })
    }

    const userEmail = ctx?.userEmail
    const tenantId = ctx?.tenantId

    if (!userEmail || !tenantId) {
      console.error('Preferences GET: Missing email or tenantId', {
        hasEmail: !!userEmail,
        hasTenantId: !!tenantId,
        email: userEmail,
        tenantId,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 60 requests/minute per IP
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:preferences:get:${ip}`, 60, 60_000)
      if (rl && rl.allowed === false) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
    } catch {}

    const email = userEmail as string
    const tid = tenantId as string

    let user
    try {
      user = await prisma.user.findFirst({
        where: { email: email, tenantId: tid },
        include: { userProfile: true },
      })
    } catch (dbError) {
      const dbMsg = dbError instanceof Error ? dbError.message : String(dbError)
      console.error('Preferences GET: Database query failed', {
        email,
        tenantId: tid,
        error: dbMsg,
      })
      // If DB is not configured in production, return safe defaults so UI can still function
      if (dbMsg.includes('Database is not configured')) {
        try {
          const defaults = PreferencesSchema.parse({})
          console.warn('Preferences GET: Returning fallback defaults due to missing DB')
          return NextResponse.json(defaults)
        } catch (schemaErr) {
          console.error('Preferences GET: Failed to construct defaults from schema', schemaErr)
          return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
        }
      }
      throw dbError
    }

    if (!user) {
      console.warn('Preferences GET: User not found', { email, tenantId: tid })

      // Add breadcrumb for user not found
      try {
        Sentry.addBreadcrumb({
          category: 'user',
          message: 'User not found when fetching preferences',
          level: 'warning',
          data: { email, tenantId: tid },
        })
      } catch {}

      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Add breadcrumb for successful fetch
    try {
      Sentry.addBreadcrumb({
        category: 'user.preferences',
        message: 'User preferences fetched',
        level: 'info',
        data: {
          userId: user.id,
          tenantId: tid,
          hasProfile: !!user.userProfile,
        },
      })
    } catch {}

    // Return preferences from user profile
    const profile = user.userProfile
    const reminderHoursArray = Array.isArray(profile?.reminderHours)
      ? (profile.reminderHours as number[])
      : [24, 2]

    const preferences = {
      timezone: profile?.timezone || 'UTC',
      preferredLanguage: profile?.preferredLanguage || 'en',
      bookingEmailConfirm: profile?.bookingEmailConfirm ?? true,
      bookingEmailReminder: profile?.bookingEmailReminder ?? true,
      bookingEmailReschedule: profile?.bookingEmailReschedule ?? true,
      bookingEmailCancellation: profile?.bookingEmailCancellation ?? true,
      bookingSmsReminder: profile?.bookingSmsReminder ?? false,
      bookingSmsConfirmation: profile?.bookingSmsConfirmation ?? false,
      reminderHours: reminderHoursArray,
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching preferences:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    Sentry.captureException(error as any)
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
})

export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    let ctx
    try {
      ctx = requireTenantContext()
    } catch (contextError) {
      console.error('Preferences PUT: Failed to get tenant context', {
        error: contextError instanceof Error ? contextError.message : String(contextError),
      })
      return NextResponse.json({ error: 'Tenant context error' }, { status: 500 })
    }

    const userEmail = ctx?.userEmail
    const tenantId = ctx?.tenantId

    if (!userEmail || !tenantId) {
      console.error('Preferences PUT: Missing email or tenantId', {
        hasEmail: !!userEmail,
        hasTenantId: !!tenantId,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = userEmail as string
    const tid = tenantId as string

    // Rate limit: 20 writes/minute per IP, also per-user to avoid shared-IP false positives
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const userId = ctx?.userId || 'anonymous'

      // Check per-IP rate limit
      const ipRateLimit = await applyRateLimit(`user:preferences:put:ip:${ip}`, 20, 60_000)
      if (ipRateLimit && ipRateLimit.allowed === false) {
        // Add breadcrumb for rate limit hit
        try {
          Sentry.addBreadcrumb({
            category: 'rate_limit',
            message: 'User preferences rate limit exceeded (IP)',
            level: 'warning',
            data: { ip, userId, tenantId: tid },
          })
        } catch {}
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }

      // Check per-user rate limit (more lenient to avoid blocking legitimate users on shared IPs)
      const userRateLimit = await applyRateLimit(`user:preferences:put:user:${userId}`, 40, 60_000)
      if (userRateLimit && userRateLimit.allowed === false) {
        // Add breadcrumb for rate limit hit
        try {
          Sentry.addBreadcrumb({
            category: 'rate_limit',
            message: 'User preferences rate limit exceeded (user)',
            level: 'warning',
            data: { userId, tenantId: tid },
          })
        } catch {}
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
    } catch {}

    const body = await request.json().catch(() => ({}))

    // Validate using Zod schema with dynamic language codes
    let validationResult
    try {
      const enabledLanguages = await getEnabledLanguageCodes()
      const dynamicSchema = createPreferencesSchema(enabledLanguages)
      validationResult = dynamicSchema.safeParse(body)
    } catch (error) {
      console.error('Failed to get enabled languages for validation', error)
      // Fallback to static schema if language registry unavailable
      validationResult = PreferencesSchema.safeParse(body)
    }

    if (!validationResult.success) {
      const messages = validationResult.error.issues.map((i) => i.message).join('; ')

      // Add breadcrumb for validation error
      try {
        Sentry.addBreadcrumb({
          category: 'validation',
          message: 'User preferences validation failed',
          level: 'warning',
          data: {
            tenantId: tid,
            errorCount: validationResult.error.issues.length,
            errors: validationResult.error.issues.map((i) => ({ field: i.path.join('.'), code: i.code })),
          },
        })
      } catch {}

      return NextResponse.json({ error: messages }, { status: 400 })
    }

    const {
      timezone,
      preferredLanguage,
      bookingEmailConfirm,
      bookingEmailReminder,
      bookingEmailReschedule,
      bookingEmailCancellation,
      bookingSmsReminder,
      bookingSmsConfirmation,
      reminderHours,
    } = validationResult.data

    // Additional timezone validation using Intl API
    if (timezone && !isValidTimezone(timezone)) {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
    }

    // Coerce reminderHours to numeric array (avoid Prisma type errors)
    let normalizedReminderHours: number[] | undefined = undefined
    if (Array.isArray(reminderHours)) {
      const nums = reminderHours.map((h: any) => Number(h)).filter((n: number) => Number.isFinite(n))
      if (nums.some((h: number) => h < 1 || h > 720)) {
        return NextResponse.json({ error: 'Reminder hours must be between 1 and 720' }, { status: 400 })
      }
      normalizedReminderHours = nums
    }

    let user
    try {
      user = await prisma.user.findFirst({ where: { email: email, tenantId: tid } })
    } catch (dbError) {
      const dbMsg = dbError instanceof Error ? dbError.message : String(dbError)
      const sanitizedPayload = sanitizePayloadForLogging(validationResult.data)
      console.error('Preferences PUT: Database query failed', {
        tenantId: tid,
        error: dbMsg,
        payloadKeys: Object.keys(sanitizedPayload),
      })
      Sentry.captureException(dbError as any, { extra: { tenantId: tid, payloadKeys: Object.keys(sanitizedPayload) } })
      if (dbMsg.includes('Database is not configured')) {
        return NextResponse.json({ error: 'Database is not configured' }, { status: 503 })
      }
      throw dbError
    }

    if (!user) {
      console.warn('Preferences PUT: User not found', { tenantId: tid })

      // Add breadcrumb for user not found
      try {
        Sentry.addBreadcrumb({
          category: 'user',
          message: 'User not found when updating preferences',
          level: 'warning',
          data: { email: email, tenantId: tid },
        })
      } catch {}

      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update or create user profile with preferences
    let updatedProfile
    try {
      updatedProfile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          timezone: timezone || 'UTC',
          preferredLanguage: preferredLanguage || 'en',
          bookingEmailConfirm: bookingEmailConfirm ?? true,
          bookingEmailReminder: bookingEmailReminder ?? true,
          bookingEmailReschedule: bookingEmailReschedule ?? true,
          bookingEmailCancellation: bookingEmailCancellation ?? true,
          bookingSmsReminder: bookingSmsReminder ?? false,
          bookingSmsConfirmation: bookingSmsConfirmation ?? false,
          reminderHours: normalizedReminderHours ?? [24, 2],
        },
        update: {
          ...(timezone && { timezone }),
          ...(preferredLanguage && { preferredLanguage }),
          ...(bookingEmailConfirm !== undefined && { bookingEmailConfirm }),
          ...(bookingEmailReminder !== undefined && { bookingEmailReminder }),
          ...(bookingEmailReschedule !== undefined && { bookingEmailReschedule }),
          ...(bookingEmailCancellation !== undefined && { bookingEmailCancellation }),
          ...(bookingSmsReminder !== undefined && { bookingSmsReminder }),
          ...(bookingSmsConfirmation !== undefined && { bookingSmsConfirmation }),
          ...(normalizedReminderHours && { reminderHours: normalizedReminderHours }),
        },
      })
    } catch (dbErr) {
      const sanitizedPayload = sanitizePayloadForLogging(validationResult.data)
      const errorMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      console.error('Preferences PUT: Database upsert failed', {
        tenantId: tid,
        userId: user.id,
        payloadKeys: Object.keys(sanitizedPayload),
        error: errorMsg,
      })

      // Add Sentry breadcrumb for failed update
      try {
        Sentry.addBreadcrumb({
          category: 'user.preferences',
          message: 'User preferences update failed',
          level: 'error',
          data: {
            userId: user.id,
            tenantId: tid,
            fieldsUpdated: Object.keys(sanitizedPayload),
            error: errorMsg,
            errorType: 'database_upsert',
          },
        })
      } catch {}

      Sentry.captureException(dbErr as any, { extra: { tenantId: tid, userId: user.id, payloadKeys: Object.keys(sanitizedPayload) } })
      return NextResponse.json({ error: 'Failed to update preferences: database error' }, { status: 500 })
    }

    try {
      await logAudit({
        action: 'user.preferences.update',
        actorId: user.id,
        targetId: user.id,
        details: { fields: Object.keys(body) },
      })
    } catch {}

    // Add Sentry breadcrumb for monitoring preference updates
    try {
      Sentry.addBreadcrumb({
        category: 'user.preferences',
        message: 'User preferences updated',
        level: 'info',
        data: {
          userId: user.id,
          tenantId: tid,
          fieldsUpdated: Object.keys(validationResult.data),
          success: true,
        },
      })
    } catch {}

    const reminderHoursArray = Array.isArray(updatedProfile.reminderHours)
      ? (updatedProfile.reminderHours as number[])
      : [24, 2]

    const preferences = {
      timezone: updatedProfile.timezone || 'UTC',
      preferredLanguage: updatedProfile.preferredLanguage || 'en',
      bookingEmailConfirm: updatedProfile.bookingEmailConfirm ?? true,
      bookingEmailReminder: updatedProfile.bookingEmailReminder ?? true,
      bookingEmailReschedule: updatedProfile.bookingEmailReschedule ?? true,
      bookingEmailCancellation: updatedProfile.bookingEmailCancellation ?? true,
      bookingSmsReminder: updatedProfile.bookingSmsReminder ?? false,
      bookingSmsConfirmation: updatedProfile.bookingSmsConfirmation ?? false,
      reminderHours: reminderHoursArray,
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating preferences:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    Sentry.captureException(error as any, { extra: { note: 'preferences.put' } })
    // Return more specific message for clients to diagnose; keep generic enough for production
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to update preferences: ${msg}` },
      { status: 500 }
    )
  }
})
