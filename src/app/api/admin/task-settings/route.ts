import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import taskService from '@/services/task-settings.service'
import { TaskWorkflowSettingsSchema } from '@/schemas/settings/task-workflow'
import * as Sentry from '@sentry/nextjs'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.TASK_WORKFLOW_SETTINGS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const settings = await taskService.get(tenantId)
  return NextResponse.json(settings)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load task settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.TASK_WORKFLOW_SETTINGS_EDIT)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => ({}))
  const parsed = TaskWorkflowSettingsSchema.partial().safeParse(body)
  if (!parsed.success) {
    try { Sentry.captureMessage('task-settings:validation_failed', { level: 'warning' } as any) } catch {}
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  }
  const updated = await taskService.upsert(tenantId, parsed.data)
  return NextResponse.json(updated)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update task settings' }, { status: 500 })
  }
}
