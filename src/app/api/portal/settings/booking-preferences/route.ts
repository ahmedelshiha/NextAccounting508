import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { respond, zodDetails } from '@/lib/api-response'
import { logAuditSafe } from '@/lib/observability-helpers'

export const runtime = 'nodejs'

// GET current user's booking preferences or sensible defaults
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return respond.unauthorized()

  const userId = (session.user as any).id as string

  try {
    // Try DB-backed preferences
    const prefs = await prisma.bookingPreferences.findUnique({ where: { userId } }).catch(() => null)
    if (prefs) {
      // Return as-is
      return respond.ok(prefs)
    }
  } catch (e: any) {
    // Fallthrough to defaults if DB not configured or not found
    const code = String((e as any)?.code || '')
    const msg = String((e as any)?.message || '')
    if (!(code.startsWith('P') || /Database is not configured/i.test(msg))) throw e
  }

  // Defaults mirror Prisma model defaults
  return respond.ok({
    userId,
    emailConfirmation: true,
    emailReminder: true,
    emailReschedule: true,
    emailCancellation: true,
    smsReminder: false,
    smsConfirmation: false,
    reminderHours: [24, 2],
    timeZone: 'UTC',
    preferredLanguage: 'en',
  })
}

export const UpdateSchema = z.object({
  emailConfirmation: z.boolean().optional(),
  emailReminder: z.boolean().optional(),
  emailReschedule: z.boolean().optional(),
  emailCancellation: z.boolean().optional(),
  smsReminder: z.boolean().optional(),
  smsConfirmation: z.boolean().optional(),
  reminderHours: z.array(z.number().int().min(1).max(168)).min(0).max(8).optional(),
  timeZone: z.string().min(1).max(64).optional(),
  preferredLanguage: z.string().min(2).max(8).optional(),
})

// PUT upserts booking preferences for the current user
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return respond.unauthorized()
  const userId = (session.user as any).id as string

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', zodDetails(parsed.error))

  try {
    const data = parsed.data as any
    const updated = await prisma.bookingPreferences.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    })
    try { await logAuditSafe({ action: 'preferences:update', actorId: userId, targetId: userId, details: { type: 'booking', fields: Object.keys(data) } }) } catch {}
    return respond.ok(updated)
  } catch (e: any) {
    const msg = String((e as any)?.message || '')
    if (/Database is not configured/i.test(msg)) {
      return respond.serverError('Database not configured')
    }
    return respond.serverError('Failed to update preferences', { message: msg })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,PUT,OPTIONS' } })
}
