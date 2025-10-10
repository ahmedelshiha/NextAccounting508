import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { requireTenantContext } from '@/lib/tenant-utils'
import taskService from '@/services/task-settings.service'
import { TaskWorkflowSettingsSchema } from '@/schemas/settings/task-workflow'
import * as Sentry from '@sentry/nextjs'
import prisma from '@/lib/prisma'
import { jsonDiff } from '@/lib/diff'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.TASK_WORKFLOW_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const settings = await taskService.get(tenantId)
    return NextResponse.json(settings)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load task settings' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.TASK_WORKFLOW_SETTINGS_EDIT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = ctx.tenantId
    const body = await request.json().catch(() => ({}))
    const parsed = TaskWorkflowSettingsSchema.partial().safeParse(body)
    if (!parsed.success) {
      try { Sentry.captureMessage('task-settings:validation_failed', { level: 'warning' } as any) } catch {}
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }
    const before = await taskService.get(tenantId).catch(()=>null)
    const updated = await taskService.upsert(tenantId, parsed.data)
    try { await prisma.settingChangeDiff.create({ data: { tenantId, userId: ctx.userId ? String(ctx.userId) : null, category: 'taskWorkflow', resource: 'task-settings', before: before || null, after: updated || null } }) } catch {}
    try { await prisma.auditEvent.create({ data: { tenantId, userId: ctx.userId ? String(ctx.userId) : null, type: 'settings.update', resource: 'task-settings', details: { category: 'taskWorkflow' } } }) } catch {}
    return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update task settings' }, { status: 500 })
  }
})
