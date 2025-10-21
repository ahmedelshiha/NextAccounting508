import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import service from '@/services/security-settings.service'
import { SecurityComplianceSettingsSchema } from '@/schemas/settings/security-compliance'
import { NextRequest } from 'next/server'
import { verifySuperAdminStepUp, stepUpChallenge } from '@/lib/security/step-up'
import { persistSettingChangeDiff } from '@/lib/settings-diff-helper'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (ctx.isSuperAdmin) {
      const ok = await verifySuperAdminStepUp(request, String(ctx.userId || ''), ctx.tenantId)
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
      const ok = await verifySuperAdminStepUp(request, String(ctx.userId || ''), ctx.tenantId)
      if (!ok) return stepUpChallenge()
    }
    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const parsed = SecurityComplianceSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await service.get(tenantId).catch(()=>null)
    const updated = await service.upsert(tenantId, parsed.data)

    try {
      const actorUserId = ctx.userId ? String(ctx.userId) : undefined
      const diffPayload: Prisma.SettingChangeDiffUncheckedCreateInput = {
        tenantId,
        category: 'securityCompliance',
        resource: 'security-settings',
        ...(actorUserId ? { userId: actorUserId } : {}),
      }
      if (before !== null) diffPayload.before = before as Prisma.InputJsonValue
      if (updated !== null && updated !== undefined) diffPayload.after = updated as Prisma.InputJsonValue
      await prisma.settingChangeDiff.create({ data: diffPayload })
    } catch {}
    try {
      const actorUserId = ctx.userId ? String(ctx.userId) : undefined
      const auditPayload: Prisma.AuditEventUncheckedCreateInput = {
        tenantId,
        type: 'settings.update',
        resource: 'security-settings',
        details: { category: 'securityCompliance' } as Prisma.InputJsonValue,
        ...(actorUserId ? { userId: actorUserId } : {}),
      }
      await prisma.auditEvent.create({ data: auditPayload })
    } catch {}

    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 })
  }
})
