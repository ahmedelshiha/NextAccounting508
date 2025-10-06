import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()

    const allowed = ['ADMIN', 'TEAM_LEAD']
    if (!ctx.role || !allowed.includes(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: any = { status: 'PENDING' }
    if (ctx.tenantId && ctx.tenantId !== 'undefined') {
      where.tenantId = String(ctx.tenantId)
    }

    const count = await prisma.booking.count({ where })

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Error fetching pending bookings count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
