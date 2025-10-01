import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { IntegrationHubSettingsSchema } from '@/schemas/settings/integration-hub'
import service from '@/services/integration-settings.service'
import * as Sentry from '@sentry/nextjs'

export async function GET(req: Request){
  try {
    const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.INTEGRATION_HUB_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const settings = await service.get(tenantId)
  return NextResponse.json({ settings })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load integration settings' }, { status: 500 })
  }
}

export async function PUT(req: Request){
  try {
    const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.INTEGRATION_HUB_EDIT)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(()=>({}))
  const parsed = IntegrationHubSettingsSchema.safeParse(body)
  if (!parsed.success) {
    try { Sentry.captureMessage('integration-hub:validation_failed', { level: 'warning' } as any) } catch {}
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  }
  const saved = await service.update(tenantId, parsed.data, (session.user as any).id)
  return NextResponse.json({ settings: saved })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update integration settings' }, { status: 500 })
  }
}
