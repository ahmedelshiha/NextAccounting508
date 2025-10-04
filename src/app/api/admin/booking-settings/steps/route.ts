import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import service from '@/services/booking-settings.service'
import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const PUT = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? ''
  if (!hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = ctx.tenantId
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  try {
    const { BookingSettingsStepsPayload } = await import('@/schemas/booking-settings.schemas')
    const parsed = BookingSettingsStepsPayload.parse(body)

    let settings = await service.getBookingSettings(tenantId)
    if (!settings) settings = await service.createDefaultSettings(tenantId)

    const updated = await service.updateBookingSteps((settings as any).id, parsed.steps)
    try { await logAudit({ action: 'booking-settings:steps:update', actorId: ctx.userId, details: { tenantId, count: updated.length } }) } catch {}
    return NextResponse.json({ steps: updated })
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid payload', details: err?.errors ?? String(err) }, { status: 400 })
  }
})
