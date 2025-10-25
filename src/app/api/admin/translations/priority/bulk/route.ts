import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const POST = withTenantContext(async (request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body || {}
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const results: any[] = []
    for (const it of items) {
      const { key, languageCode, priority = 'MEDIUM', status = 'OPEN', dueDate, assignedToUserId, notes } = it
      if (!key) continue
      const upserted = await prisma.translationPriority.upsert({
        where: { tenantId_key_languageCode: { tenantId: ctx.tenantId, key, languageCode: languageCode ?? null } },
        update: {
          priority,
          status,
          dueDate: dueDate ? new Date(dueDate) : null,
          assignedToUserId: assignedToUserId || null,
          notes: notes || null,
        },
        create: {
          tenantId: ctx.tenantId,
          key,
          languageCode: languageCode || null,
          priority,
          status,
          dueDate: dueDate ? new Date(dueDate) : null,
          assignedToUserId: assignedToUserId || null,
          notes: notes || null,
        },
      })
      results.push(upserted)
    }

    return NextResponse.json({ success: true, data: { count: results.length, items: results } })
  } catch (error: any) {
    console.error('[priority][BULK] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to bulk upsert' }, { status: 500 })
  }
})
