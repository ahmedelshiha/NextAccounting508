import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import service from '@/services/booking-settings.service'
import { BookingSettingsFormsPayload } from '@/schemas/booking-settings.schemas'
import { logAudit } from '@/lib/audit'

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => ({}))
  const parsed = BookingSettingsFormsPayload.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })

  try {
    const updated = await service.updateBookingSettings(tenantId, { forms: parsed.data.forms } as any)
    try { await logAudit({ action: 'booking-settings:forms:update', actorId: session.user.id, details: { tenantId } }) } catch {}
    return NextResponse.json({ forms: (updated as any).forms })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update forms settings' }, { status: 500 })
  }
}
