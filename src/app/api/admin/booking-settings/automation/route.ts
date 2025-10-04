import { NextResponse } from 'next/server'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import service from '@/services/booking-settings.service'
import { BookingSettingsAutomationPayload } from '@/schemas/booking-settings.schemas'
import { logAudit } from '@/lib/audit'

export const PUT = withTenantContext(async (req: Request) => {
  const ctx = requireTenantContext()
  if (!ctx?.role || !hasPermission(ctx.role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = ctx.tenantId ?? null
  const body = await req.json().catch(() => ({}))
  const parsed = BookingSettingsAutomationPayload.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })

  try {
    const updated = await service.updateBookingSettings(tenantId, { automation: parsed.data.automation } as any)
    try { await logAudit({ action: 'booking-settings:automation:update', actorId: ctx.userId ?? null, details: { tenantId } }) } catch {}
    return NextResponse.json({ automation: (updated as any).automation })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update automation settings' }, { status: 500 })
  }
})
