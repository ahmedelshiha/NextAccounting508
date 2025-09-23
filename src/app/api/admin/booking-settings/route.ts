import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import service from '@/services/booking-settings.service'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? ''
  if (!session?.user || !hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  try {
    let settings = await service.getBookingSettings(tenantId)
    if (!settings) settings = await service.createDefaultSettings(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch booking settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? ''
  if (!session?.user || !hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const updates = await req.json().catch(() => null)
  if (!updates || typeof updates !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  try {
    const validated = await service.validateSettingsUpdate(tenantId, updates)
    if (!validated.isValid) return NextResponse.json({ error: 'Settings validation failed', errors: validated.errors, warnings: validated.warnings }, { status: 400 })

    const settings = await service.updateBookingSettings(tenantId, updates)
    try { await logAudit({ action: 'booking-settings:update', actorId: session.user.id, details: { tenantId, updates } }) } catch {}
    return NextResponse.json({ settings, warnings: validated.warnings })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update booking settings' }, { status: 500 })
  }
}
