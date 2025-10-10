import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { captureErrorIfAvailable, logAuditSafe } from '@/lib/observability-helpers'
import { sendBookingReminders } from '@/lib/cron'
import { withTenantContext } from '@/lib/api-wrapper'

export const runtime = 'nodejs'

// POST /api/cron/reminders
// Protected cron endpoint that scans upcoming confirmed appointments and sends reminders.
const _api_POST = async (req: Request) => {
  try {
    const secret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET
    const header = req.headers.get('x-cron-secret') || ''
    if (secret && header && header !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const hasDbEnv = !!process.env.NETLIFY_DATABASE_URL || !!process.env.DATABASE_URL
    let hasDb = hasDbEnv
    try {
      if (hasDbEnv && typeof (prisma as any).$queryRaw === 'function') {
        await (prisma as any).$queryRaw`SELECT 1`
      }
    } catch {
      hasDb = false
    }

    if (!hasDb) {
      try { await logAuditSafe({ action: 'cron:reminders:skipped', details: { reason: 'no_db' } }) } catch {}
      return NextResponse.json({ success: true, processed: 0, note: 'Database not configured; skipping reminders' })
    }

    if (secret && !header && process.env.NODE_ENV !== 'test') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await sendBookingReminders()
    return NextResponse.json(result)
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'cron:reminders' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export const POST = withTenantContext(_api_POST, { requireAuth: false })
