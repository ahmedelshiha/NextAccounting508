import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const GET = withTenantContext(async (request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    const url = new URL(request.url)
    const { searchParams } = url

    const filters: any = { tenantId }
    if (searchParams.get('priority')) filters.priority = searchParams.get('priority')
    if (searchParams.get('status')) filters.status = searchParams.get('status')
    if (searchParams.get('language')) filters.languageCode = searchParams.get('language')
    if (searchParams.get('key')) filters.key = { contains: searchParams.get('key') || '', mode: 'insensitive' }

    const items = await prisma.translationPriority.findMany({ where: filters, orderBy: { updatedAt: 'desc' } })

    return NextResponse.json({ success: true, data: items })
  } catch (error: any) {
    console.error('[priority][GET] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch priorities' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, languageCode, priority = 'MEDIUM', status = 'OPEN', dueDate, assignedToUserId, notes } = body || {}

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Upsert by tenantId + key + languageCode
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

    return NextResponse.json({ success: true, data: upserted })
  } catch (error: any) {
    console.error('[priority][POST] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create priority' }, { status: 500 })
  }
})
