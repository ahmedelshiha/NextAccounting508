import { NextRequest, NextResponse } from 'next/server'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import service from '@/services/booking-settings.service'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const PUT = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? ''
  if (!ctx?.userId || !hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = ctx.tenantId ?? null
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  try {
    const { BookingSettingsBusinessHoursPayload } = await import('@/schemas/booking-settings.schemas')
    const parsed = BookingSettingsBusinessHoursPayload.parse(body)

    let settings = await service.getBookingSettings(tenantId)
    if (!settings) settings = await service.createDefaultSettings(tenantId)

    const updated = await service.updateBusinessHours((settings as any).id, parsed.businessHours)
    try { await logAudit({ action: 'booking-settings:business-hours:update', actorId: ctx.userId ?? null, details: { tenantId, days: updated.length } }) } catch {}
    return NextResponse.json({ businessHours: updated })
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid payload', details: err?.errors ?? String(err) }, { status: 400 })
  }
})
