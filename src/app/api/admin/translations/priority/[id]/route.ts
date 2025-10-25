import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const PUT = withTenantContext(async (request, context) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = (context?.params || {}) as any
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = await request.json()
    const { priority, status, dueDate, assignedToUserId, notes } = body || {}

    const updated = await prisma.translationPriority.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: {
        priority: priority || undefined,
        status: status || undefined,
        dueDate: typeof dueDate === 'string' ? new Date(dueDate) : dueDate ?? undefined,
        assignedToUserId: assignedToUserId ?? undefined,
        notes: notes ?? undefined,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const record = await prisma.translationPriority.findUnique({ where: { id } })
    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error('[priority][PUT] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update priority' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request, context) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = (context?.params || {}) as any
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    await prisma.translationPriority.deleteMany({ where: { id, tenantId: ctx.tenantId } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[priority][DELETE] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete priority' }, { status: 500 })
  }
})
