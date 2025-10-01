import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import * as Sentry from '@sentry/nextjs'
import { buildExportBundle } from '@/lib/settings/export'
import service from '@/services/financial-settings.service'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.FINANCIAL_SETTINGS_EXPORT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = getTenantFromRequest(req as any)
    const ip = getClientIp(req)
    const key = `financial-settings:export:${tenantId}:${ip}`
    if (!rateLimit(key, 10, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const settings = await service.get(tenantId)
    return NextResponse.json(buildExportBundle('financial', settings))
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to export financial settings' }, { status: 500 })
  }
}
