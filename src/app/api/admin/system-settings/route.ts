import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import * as Sentry from '@sentry/nextjs'
import { SystemAdministrationSettingsSchema } from '@/schemas/settings/system-administration'
import systemService from '@/services/system-settings.service'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = getTenantFromRequest(req as any)
    const settings = await systemService.get(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load system settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = getTenantFromRequest(req as any)
    const body = await req.json().catch(() => ({}))
    const parsed = SystemAdministrationSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('system-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const updated = await systemService.upsert(tenantId, parsed.data, (session.user as any).id)
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 })
  }
}
