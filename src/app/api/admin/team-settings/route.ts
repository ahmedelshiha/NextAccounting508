import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import teamService from '@/services/team-settings.service'
import { TeamSettingsSchema } from '@/schemas/settings/team-management'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.TEAM_SETTINGS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const settings = await teamService.get(tenantId)
  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.TEAM_SETTINGS_EDIT)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => ({}))
  const parsed = TeamSettingsSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  const updated = await teamService.upsert(tenantId, parsed.data)
  return NextResponse.json(updated)
}
