import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import service from '@/services/booking-settings.service'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? ''
  if (!session?.user || !hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_VIEW)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = getTenantFromRequest(req as any)
  const updates = await req.json().catch(() => null)
  if (!updates || typeof updates !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const validation = await service.validateSettingsUpdate(tenantId, updates)
  return NextResponse.json(validation)
}
