import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import service from '@/services/booking-settings.service'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? ''
  if (!hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_VIEW)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = ctx.tenantId
  const updates = await req.json().catch(() => null)
  if (!updates || typeof updates !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const validation = await service.validateSettingsUpdate(tenantId, updates)
  return NextResponse.json(validation)
})
