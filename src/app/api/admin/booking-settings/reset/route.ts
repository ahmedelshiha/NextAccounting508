import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import service from '@/services/booking-settings.service'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? ''
  if (!session?.user || !hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_RESET)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = getTenantFromRequest(req as any)
  try {
    const settings = await service.resetToDefaults(tenantId)
    try { await logAudit({ action: 'booking-settings:reset', actorId: session.user.id, details: { tenantId } }) } catch {}
    return NextResponse.json({ settings })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reset booking settings' }, { status: 500 })
  }
}
