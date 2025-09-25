import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import service from '@/services/booking-settings.service'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? ''
  if (!session?.user || !hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.businessHours)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  let settings = await service.getBookingSettings(tenantId)
  if (!settings) settings = await service.createDefaultSettings(tenantId)

  const updated = await service.updateBusinessHours((settings as any).id, body.businessHours)
  try { await logAudit({ action: 'booking-settings:business-hours:update', actorId: session.user.id, details: { tenantId, days: updated.length } }) } catch {}
  return NextResponse.json({ businessHours: updated })
}
