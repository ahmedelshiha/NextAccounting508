import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import analyticsService from '@/services/analytics-settings.service'
import { AnalyticsReportingSettingsSchema } from '@/schemas/settings/analytics-reporting'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const settings = await analyticsService.get(tenantId)
  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EDIT)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => ({}))
  const parsed = AnalyticsReportingSettingsSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  const updated = await analyticsService.upsert(tenantId, parsed.data)
  return NextResponse.json(updated)
}
