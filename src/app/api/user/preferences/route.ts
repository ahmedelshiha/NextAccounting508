import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PreferencesSchema, isValidTimezone } from '@/schemas/user-profile'
import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const userEmail = ctx.userEmail
    const tenantId = ctx.tenantId

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

    const user = await prisma.user.findFirst({
      where: { email: email, tenantId: tid },
      include: { userProfile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return preferences from user profile
    const profile = user.userProfile
    const preferences = {
      timezone: profile?.timezone || 'UTC',
      preferredLanguage: profile?.preferredLanguage || 'en',
      bookingEmailConfirm: profile?.bookingEmailConfirm ?? true,
      bookingEmailReminder: profile?.bookingEmailReminder ?? true,
      bookingEmailReschedule: profile?.bookingEmailReschedule ?? true,
      bookingEmailCancellation: profile?.bookingEmailCancellation ?? true,
      bookingSmsReminder: profile?.bookingSmsReminder ?? false,
      bookingSmsConfirmation: profile?.bookingSmsConfirmation ?? false,
      reminderHours: Array.isArray(profile?.reminderHours) ? profile!.reminderHours : [24, 2],
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
})

export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    const userEmail = ctx.userEmail
    const tenantId = ctx.tenantId

    if (!userEmail || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 20 writes/minute per IP
    try {
      const { applyRateLimit, getClientIp } = await import('@/lib/rate-limit')
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:preferences:put:${ip}`, 20, 60_000)
      if (rl && rl.allowed === false) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
    } catch {}

    const email = userEmail as string
    const tid = tenantId as string

    const body = await request.json().catch(() => ({}))

    // Validate using Zod schema
    const validationResult = PreferencesSchema.safeParse(body)
    if (!validationResult.success) {
      const messages = validationResult.error.issues.map((i) => i.message).join('; ')
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

    // Validate reminder hours are in valid range
    if (reminderHours && reminderHours.some((h) => h < 1 || h > 720)) {
      return NextResponse.json({ error: 'Reminder hours must be between 1 and 720' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ where: { email: email, tenantId: tid } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update or create user profile with preferences
    const updatedProfile = await prisma.userProfile.upsert({
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
        reminderHours: reminderHours || [24, 2],
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
        ...(reminderHours && { reminderHours }),
      },
    })

    try {
      await logAudit({
        action: 'user.preferences.update',
        actorId: user.id,
        targetId: user.id,
        details: { fields: Object.keys(body) },
      })
    } catch {}

    const preferences = {
      timezone: updatedProfile.timezone || 'UTC',
      preferredLanguage: updatedProfile.preferredLanguage || 'en',
      bookingEmailConfirm: updatedProfile.bookingEmailConfirm ?? true,
      bookingEmailReminder: updatedProfile.bookingEmailReminder ?? true,
      bookingEmailReschedule: updatedProfile.bookingEmailReschedule ?? true,
      bookingEmailCancellation: updatedProfile.bookingEmailCancellation ?? true,
      bookingSmsReminder: updatedProfile.bookingSmsReminder ?? false,
      bookingSmsConfirmation: updatedProfile.bookingSmsConfirmation ?? false,
      reminderHours: Array.isArray(updatedProfile.reminderHours) ? updatedProfile.reminderHours : [24, 2],
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
})
