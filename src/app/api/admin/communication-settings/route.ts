import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import communicationSettingsService from '@/services/communication-settings.service'
import { CommunicationSettingsPatchSchema } from '@/schemas/settings/communication'
import * as Sentry from '@sentry/nextjs'

const patchSchema = CommunicationSettingsPatchSchema
// Validate partial updates from the settings UI before persisting them.

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.COMMUNICATION_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = getTenantFromRequest(req as any)
    const settings = await communicationSettingsService.get(tenantId)

    return NextResponse.json(settings)
  } catch (e) {
    try {
      Sentry.captureException(e as any)
    } catch {}
    return NextResponse.json({ error: 'Failed to load communication settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.COMMUNICATION_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = getTenantFromRequest(req as any)
    const body = await req.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      try {
        Sentry.captureMessage('communication-settings:validation_failed', { level: 'warning' } as any)
      } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const updated = await communicationSettingsService.upsert(tenantId, parsed.data)
    return NextResponse.json(updated)
  } catch (e) {
    try {
      Sentry.captureException(e as any)
    } catch {}
    return NextResponse.json({ error: 'Failed to update communication settings' }, { status: 500 })
  }
}
