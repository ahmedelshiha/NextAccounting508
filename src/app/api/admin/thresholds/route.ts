import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async (_request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const threshold = await prisma.healthThreshold.findFirst({ orderBy: { id: 'desc' as const } })
    if (!threshold) {
      return NextResponse.json({ responseTime: 100, errorRate: 1.0, storageGrowth: 20.0 })
    }
    return NextResponse.json({ responseTime: threshold.responseTime, errorRate: threshold.errorRate, storageGrowth: threshold.storageGrowth })
  } catch (err) {
    console.error('Thresholds GET error', err)
    return NextResponse.json({ error: 'Failed to read thresholds' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (_request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await _request.json()
    const { responseTime, errorRate, storageGrowth } = body
    if (typeof responseTime !== 'number' || typeof errorRate !== 'number' || typeof storageGrowth !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const existing = await prisma.healthThreshold.findFirst({ orderBy: { id: 'desc' as const } })
    let upserted
    if (existing) {
      upserted = await prisma.healthThreshold.update({ where: { id: existing.id }, data: { responseTime, errorRate, storageGrowth } })
    } else {
      upserted = await prisma.healthThreshold.create({ data: { responseTime, errorRate, storageGrowth } })
    }

    return NextResponse.json({ responseTime: upserted.responseTime, errorRate: upserted.errorRate, storageGrowth: upserted.storageGrowth })
  } catch (err) {
    console.error('Thresholds POST error', err)
    return NextResponse.json({ error: 'Failed to save thresholds' }, { status: 500 })
  }
})
