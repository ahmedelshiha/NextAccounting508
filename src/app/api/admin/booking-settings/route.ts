import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import service from '@/services/booking-settings.service'
import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'
import { persistSettingChangeDiff } from '@/lib/settings-diff-helper'

export const GET = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? ''
  if (!hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_VIEW)) {
    return respond.forbidden('Forbidden')
  }
  const tenantId = ctx.tenantId
  try {
    let settings = await service.getBookingSettings(tenantId)
    if (!settings) settings = await service.createDefaultSettings(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch booking settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? ''
  if (!hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) {
    return respond.forbidden('Forbidden')
  }
  const tenantId = ctx.tenantId
  const updates = await req.json().catch(() => null)
  if (!updates || typeof updates !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  try {
    const validated = await service.validateSettingsUpdate(tenantId, updates)
    if (!validated.isValid) return NextResponse.json({ error: 'Settings validation failed', errors: validated.errors, warnings: validated.warnings }, { status: 400 })

    const before = await service.getBookingSettings(tenantId).catch(() => null)
    const settings = await service.updateBookingSettings(tenantId, updates)

    try { await logAudit({ action: 'booking-settings:update', actorId: ctx.userId, details: { tenantId, updates } }) } catch {}

    // Persist change diff and audit event
    if (tenantId) {
      await persistSettingChangeDiff({
        tenantId,
        category: 'booking',
        resource: 'booking-settings',
        userId: ctx.userId,
        before,
        after: settings,
      })
    }

    return NextResponse.json({ settings, warnings: validated.warnings })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update booking settings' }, { status: 500 })
  }
})
