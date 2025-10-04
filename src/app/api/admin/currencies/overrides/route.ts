import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const GET = withTenantContext(async (_request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(_request.url)
    const entity = searchParams.get('entity')
    const entityId = searchParams.get('id')
    if (!entity || !entityId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const list = await prisma.priceOverride.findMany({ where: { entity, entityId } })
    return NextResponse.json(list)
  } catch (e) {
    console.error('GET /api/admin/currencies/overrides error', e)
    return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entity, entityId, currencyCode, priceCents, note } = body
    if (!entity || !entityId || !currencyCode || typeof priceCents !== 'number') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const existing = await prisma.priceOverride.findFirst({ where: { entity, entityId, currencyCode } })
    let saved
    if (existing) {
      saved = await prisma.priceOverride.update({ where: { id: existing.id }, data: { priceCents, note } })
      await logAudit({ action: 'price_override:update', actorId: ctx.userId ?? null, targetId: String(existing.id), details: { before: existing, after: saved } })
    } else {
      saved = await prisma.priceOverride.create({ data: { entity, entityId, currencyCode, priceCents, note } })
      await logAudit({ action: 'price_override:create', actorId: ctx.userId ?? null, targetId: String(saved.id), details: saved })
    }

    return NextResponse.json(saved)
  } catch (e) {
    console.error('POST /api/admin/currencies/overrides error', e)
    return NextResponse.json({ error: 'Failed to save override' }, { status: 500 })
  }
})
