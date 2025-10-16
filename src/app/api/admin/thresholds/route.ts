import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'

export const revalidate = 0
export const dynamic = 'force-dynamic'

let lastThreshold: { responseTime: number; errorRate: number; storageGrowth: number } | null = null

export const GET = withTenantContext(async (_request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return respond.unauthorized()
    }

    const threshold = await prisma.healthThreshold.findFirst({ orderBy: { id: 'desc' as const } }).catch(() => null as any)
    if (!threshold && lastThreshold) {
      return NextResponse.json(lastThreshold)
    }
    if (!threshold) {
      return NextResponse.json({ responseTime: 100, errorRate: 1.0, storageGrowth: 20.0 })
    }
    lastThreshold = { responseTime: threshold.responseTime, errorRate: threshold.errorRate, storageGrowth: threshold.storageGrowth }
    return NextResponse.json(lastThreshold)
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
      return respond.unauthorized()
    }

    const body = await _request.json().catch(() => ({}))
    const { responseTime, errorRate, storageGrowth } = body as any
    if (typeof responseTime !== 'number' || typeof errorRate !== 'number' || typeof storageGrowth !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    let existing: any = null
    try {
      existing = await prisma.healthThreshold.findFirst({ orderBy: { id: 'desc' as const } })
    } catch {}
    let rec: any = null
    try {
      if (existing && (existing as any).id != null) {
        rec = await prisma.healthThreshold.update({ where: { id: (existing as any).id }, data: { responseTime, errorRate, storageGrowth } })
      } else {
        rec = await prisma.healthThreshold.create({ data: { responseTime, errorRate, storageGrowth } })
      }
    } catch {
      rec = null
    }

    const rt = Number(responseTime)
    const er = Number(errorRate)
    const sg = Number(storageGrowth)
    lastThreshold = { responseTime: rec?.responseTime ?? rt, errorRate: rec?.errorRate ?? er, storageGrowth: rec?.storageGrowth ?? sg }
    return NextResponse.json(lastThreshold)
  } catch (err) {
    console.error('Thresholds POST error', err)
    return NextResponse.json({ error: 'Failed to save thresholds' }, { status: 500 })
  }
})
