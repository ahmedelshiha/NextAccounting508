import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

export const POST = withTenantContext(async (request: Request, context: any) => {
  const params = context?.params || context
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_ASSIGN)) {
      return respond.forbidden('Forbidden')
    }

    const { id } = params
    const body = await request.json().catch(() => ({}))
    const assigneeId = body.assigneeId ?? null
    const updated = await prisma.task.update({ where: { id }, data: { assigneeId }, include: { assignee: { select: { id: true, name: true, email: true } } } })
    try {
      const { broadcast } = await import('@/lib/realtime')
      broadcast({ type: 'task.updated', payload: updated })
    } catch (e) {}
    return NextResponse.json(updated)
  } catch (err) {
    console.error('POST /api/admin/tasks/[id]/assign error', err)
    return NextResponse.json({ error: 'Failed to assign' }, { status: 500 })
  }
})
