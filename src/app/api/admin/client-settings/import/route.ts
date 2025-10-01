import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import * as Sentry from '@sentry/nextjs'
import { validateImportWithSchema } from '@/lib/settings/export'
import { ClientManagementSettingsSchema } from '@/schemas/settings/client-management'
import clientService from '@/services/client-settings.service'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.CLIENT_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = getTenantFromRequest(req as any)
    const ip = getClientIp(req)
    const key = `client-settings:import:${tenantId}:${ip}`
    if (!rateLimit(key, 3, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await req.json().catch(() => ({}))
    const data = validateImportWithSchema(body, ClientManagementSettingsSchema)
    const updated = await clientService.upsert(tenantId, data)
    try { await logAudit({ action: 'client-settings:import', actorId: (session.user as any).id, details: { tenantId } }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to import client settings' }, { status: 500 })
  }
}
