import { NextResponse } from 'next/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import service from '@/services/booking-settings.service'
import { BookingSettingsCapacityPayload } from '@/schemas/booking-settings.schemas'
import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const PUT = withTenantContext(async (req: Request) => {
  const ctx = requireTenantContext()
  if (!hasPermission(ctx.role || undefined, PERMISSIONS.BOOKING_SETTINGS_EDIT)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = BookingSettingsCapacityPayload.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })

  try {
    const updated = await service.updateBookingSettings(ctx.tenantId, { capacity: parsed.data.capacity } as any)
    try { await logAudit({ action: 'booking-settings:capacity:update', actorId: ctx.userId, details: { tenantId: ctx.tenantId } }) } catch {}
    return NextResponse.json({ capacity: (updated as any).capacity })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update capacity settings' }, { status: 500 })
  }
})
