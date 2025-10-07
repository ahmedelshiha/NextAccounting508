import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import * as Sentry from '@sentry/nextjs'
import { validateImportWithSchema } from '@/lib/settings/export'
import { TaskWorkflowSettingsSchema } from '@/schemas/settings/task-workflow'
import taskService from '@/services/task-settings.service'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.TASK_WORKFLOW_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const ip = getClientIp(request as any)
    const key = `task-settings:import:${tenantId}:${ip}`
    const rl = await applyRateLimit(key, 3, 60_000)
    if (!rl.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId, ip, key, route: new URL(request.url).pathname } }) } catch {}
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const data = validateImportWithSchema(body, TaskWorkflowSettingsSchema)
    const updated = await taskService.upsert(tenantId, data)
    try { await logAudit({ action: 'task-settings:import', actorId: ctx.userId, details: { tenantId } }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to import task settings' }, { status: 500 })
  }
})
