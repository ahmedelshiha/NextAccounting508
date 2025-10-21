import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'

export const PATCH = withTenantContext(async (request: NextRequest, context: { params: Promise<{ code: string }> }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return respond.forbidden('Forbidden')
    }

    const params = await context.params
    const code = params.code.toUpperCase()
    const body = await request.json()

    if (body.isDefault) {
      await prisma.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const updated = await prisma.currency.update({ where: { code }, data: body })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/admin/currencies/[code] error', e)
    return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 })
  }
})
