import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import service from '@/services/security-settings.service'
import { SecurityComplianceSettingsSchema } from '@/schemas/settings/security-compliance'
import { NextRequest } from 'next/server'
import { verifySuperAdminStepUp, stepUpChallenge } from '@/lib/security/step-up'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (ctx.isSuperAdmin) {
      const ok = await verifySuperAdminStepUp(request, String(ctx.userId || ''))
      if (!ok) return stepUpChallenge()
    }
    const tenantId = ctx.tenantId
    const settings = await service.get(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load security settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (ctx.isSuperAdmin) {
      const ok = await verifySuperAdminStepUp(request, String(ctx.userId || ''))
      if (!ok) return stepUpChallenge()
    }
    const tenantId = ctx.tenantId
    const body = await request.json().catch(() => ({}))
    const parsed = SecurityComplianceSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const updated = await service.upsert(tenantId, parsed.data)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 })
  }
})
