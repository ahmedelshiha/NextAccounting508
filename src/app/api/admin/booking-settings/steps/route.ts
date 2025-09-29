import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import service from '@/services/booking-settings.service'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? ''
  if (!session?.user || !hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  // Validate with zod
  try {
    const { BookingSettingsStepsPayload } = await import('@/schemas/booking-settings.schemas')
    const parsed = BookingSettingsStepsPayload.parse(body)

    let settings = await service.getBookingSettings(tenantId)
    if (!settings) settings = await service.createDefaultSettings(tenantId)

    const updated = await service.updateBookingSteps((settings as any).id, parsed.steps)
    try { await logAudit({ action: 'booking-settings:steps:update', actorId: session.user.id, details: { tenantId, count: updated.length } }) } catch {}
    return NextResponse.json({ steps: updated })
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid payload', details: err?.errors ?? String(err) }, { status: 400 })
  }
}
