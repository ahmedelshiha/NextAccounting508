import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

function mapStatusToDb(s: string): any {
  const v = String(s || '').toUpperCase()
  if (v === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (v === 'DONE' || v === 'COMPLETED') return 'DONE'
  if (v === 'OPEN' || v === 'PENDING') return 'OPEN'
  return 'OPEN'
}

export const PATCH = withTenantContext(async (request: Request, context: any) => {
  const params = context?.params || context
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_UPDATE)) {
      return respond.forbidden('Forbidden')
    }

    const { id } = params
    const body = await request.json().catch(() => ({}))
    const status = mapStatusToDb(body.status)
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    const updated = await prisma.task.update({ where: { id }, data: { status }, include: { assignee: { select: { id: true, name: true, email: true } } } })
    try {
      const { broadcast } = await import('@/lib/realtime')
      ;(broadcast as any)({ type: 'task.updated', payload: updated })
    } catch (e) {}
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/admin/tasks/[id]/status error', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
})
