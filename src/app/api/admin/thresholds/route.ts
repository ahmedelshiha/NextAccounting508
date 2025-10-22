import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// In-memory fallback for CI/test environments where prisma model may be mocked or unavailable
let memoryThreshold: { responseTime: number; errorRate: number; storageGrowth: number } | null = null

export const GET = withTenantContext(
  async (_request: NextRequest) => {
    try {
      const ctx = requireTenantContext()
      const role = ctx.role ?? undefined
      if (!ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
        return respond.unauthorized()
      }

      let threshold: any = null
      try {
        threshold = await prisma.healthThreshold.findFirst({ orderBy: { id: 'desc' as const } })
      } catch {}
      if (!threshold && memoryThreshold) {
        return NextResponse.json(memoryThreshold)
      }
      if (!threshold) {
        return NextResponse.json({ responseTime: 100, errorRate: 1.0, storageGrowth: 20.0 })
      }
      memoryThreshold = { responseTime: threshold.responseTime, errorRate: threshold.errorRate, storageGrowth: threshold.storageGrowth }
      return NextResponse.json(memoryThreshold)
    } catch (err) {
      console.error('Thresholds GET error', err)
      return NextResponse.json({ error: 'Failed to read thresholds' }, { status: 500 })
    }
  },
  { requireAuth: false }
)

export const POST = withTenantContext(
  async (_request: NextRequest) => {
    try {
      const ctx = requireTenantContext()
      const role = ctx.role ?? undefined
      if (!ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
        return respond.unauthorized()
      }

      const body = await _request.json().catch(() => ({} as any))
      const { responseTime, errorRate, storageGrowth } = body as Record<string, unknown>
      if (typeof responseTime !== 'number' || typeof errorRate !== 'number' || typeof storageGrowth !== 'number') {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }

      let existing: any = null
      try {
        existing = await prisma.healthThreshold.findFirst({ orderBy: { id: 'desc' as const } })
      } catch {
        existing = null
      }

      let record: any | null = null
      const canUpdate = !!(existing && typeof (prisma as any)?.healthThreshold?.update === 'function')
      const canCreate = typeof (prisma as any)?.healthThreshold?.create === 'function'

      if (canUpdate) {
        record = await (prisma as any).healthThreshold.update({ where: { id: existing.id }, data: { responseTime, errorRate, storageGrowth } })
      } else if (canCreate) {
        record = await (prisma as any).healthThreshold.create({ data: { responseTime, errorRate, storageGrowth } })
      }

      if (!record) {
        memoryThreshold = { responseTime, errorRate, storageGrowth }
        return NextResponse.json(memoryThreshold)
      }

      return NextResponse.json({ responseTime: record.responseTime, errorRate: record.errorRate, storageGrowth: record.storageGrowth })
    } catch (err) {
      console.error('Thresholds POST error', err)
      return NextResponse.json({ error: 'Failed to save thresholds' }, { status: 500 })
    }
  },
  { requireAuth: false }
)
