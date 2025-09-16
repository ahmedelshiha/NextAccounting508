export const revalidate = 0
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = !!process.env.NETLIFY_DATABASE_URL
    const now = new Date()

    if (!hasDb) {
      const tsNow = now.getTime()
      const entries = Array.from({ length: 12 }).map((_, i) => {
        const ts = new Date(tsNow - (11 - i) * 60 * 60 * 1000)
        return { timestamp: ts.toISOString(), databaseResponseTime: 80, apiErrorRate: 0.5 }
      })
      return NextResponse.json({ entries })
    }

    const since = new Date(now.getTime() - 12 * 60 * 60 * 1000)
    const logs = await prisma.healthLog.findMany({ where: { checkedAt: { gte: since } }, orderBy: { checkedAt: 'asc' } })

    // Bucket by hour
    const buckets = new Map<string, { total: number; errors: number }>()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getTime() - (11 - i) * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 13) // YYYY-MM-DDTHH
      buckets.set(key, { total: 0, errors: 0 })
    }

    logs.forEach(l => {
      const key = l.checkedAt.toISOString().slice(0, 13)
      if (!buckets.has(key)) buckets.set(key, { total: 0, errors: 0 })
      const b = buckets.get(key)!
      b.total += 1
      const isError = String(l.status).toLowerCase() === 'error' || String(l.status).toLowerCase() === 'critical'
      if (isError) b.errors += 1
    })

    const entries = Array.from(buckets.entries()).map(([hour, { total, errors }]) => {
      const date = new Date(hour + ':00:00.000Z')
      const apiErrorRate = total > 0 ? Math.round((errors / total) * 100) / 100 : 0
      const databaseResponseTime = 50 + errors * 10 // simplistic mapping
      return { timestamp: date.toISOString(), databaseResponseTime, apiErrorRate }
    })

    return NextResponse.json({ entries })
  } catch (e) {
    console.error('health-history error', e)
    return NextResponse.json({ error: 'Failed to load health history' }, { status: 500 })
  }
}
