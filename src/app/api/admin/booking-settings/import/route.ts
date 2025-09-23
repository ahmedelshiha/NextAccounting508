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
  if (!session?.user || !hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_IMPORT)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  try {
    const settings = await service.importSettings(tenantId, body)
    try { await logAudit({ action: 'booking-settings:import', actorId: session.user.id, details: { tenantId } }) } catch {}
    return NextResponse.json({ settings })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to import settings' }, { status: 500 })
  }
}
