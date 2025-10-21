import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'

export async function GET(request: NextRequest) {
  try {
    const ctx = requireTenantContext()
    const userEmail = ctx.userEmail

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: { email: userEmail, tenantId: ctx.tenantId },
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = requireTenantContext()

    const userEmail = ctx.userEmail

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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
    } = body

    // Validate inputs
    if (timezone && !isValidTimezone(timezone)) {
      return NextResponse.json(
        { error: { message: 'Invalid timezone' } },
        { status: 400 }
      )
    }

    if (preferredLanguage && !['en', 'ar', 'hi'].includes(preferredLanguage)) {
      return NextResponse.json(
        { error: { message: 'Invalid language' } },
        { status: 400 }
      )
    }

    if (reminderHours && !Array.isArray(reminderHours)) {
      return NextResponse.json(
        { error: { message: 'reminderHours must be an array' } },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({ where: { email: userEmail, tenantId: ctx.tenantId } })

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

    const preferences = {
      timezone: updatedProfile.timezone || 'UTC',
      preferredLanguage: updatedProfile.preferredLanguage || 'en',
      bookingEmailConfirm: updatedProfile.bookingEmailConfirm ?? true,
      bookingEmailReminder: updatedProfile.bookingEmailReminder ?? true,
      bookingEmailReschedule: updatedProfile.bookingEmailReschedule ?? true,
      bookingEmailCancellation: updatedProfile.bookingEmailCancellation ?? true,
      bookingSmsReminder: updatedProfile.bookingSmsReminder ?? false,
      bookingSmsConfirmation: updatedProfile.bookingSmsConfirmation ?? false,
      reminderHours: Array.isArray(updatedProfile.reminderHours)
        ? updatedProfile.reminderHours
        : [24, 2],
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Validate timezone string
 * This is a basic check - a production app might use a more robust library
 */
function isValidTimezone(tz: string): boolean {
  const validTimezones = [
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
  return validTimezones.includes(tz)
}
