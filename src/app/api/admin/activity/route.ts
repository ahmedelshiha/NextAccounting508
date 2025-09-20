import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

// GET /api/admin/activity?type=AUDIT&status=INFO&q=text&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = getTenantFromRequest(request as unknown as Request)
    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')
    const statusParam = searchParams.get('status')
    const q = searchParams.get('q') || ''
    const type = (searchParams.get('type') || 'AUDIT').toUpperCase()

    const take = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20
    const page = Math.max(1, pageParam ? parseInt(pageParam, 10) || 1 : 1)
    const skip = (page - 1) * take

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)

    // Fallback (no DB): return a small, filtered, paginated demo set
    if (!hasDb) {
      const all = [
        { id: 'a1', checkedAt: new Date().toISOString(), service: type, status: 'INFO', message: JSON.stringify({ action: 'demo.action', details: {} }) },
        { id: 'a2', checkedAt: new Date(Date.now() - 1000 * 60).toISOString(), service: type, status: 'WARN', message: JSON.stringify({ action: 'demo.warn', details: { q: 'warn' } }) },
        { id: 'a3', checkedAt: new Date(Date.now() - 1000 * 120).toISOString(), service: type, status: 'ERROR', message: JSON.stringify({ action: 'demo.error', details: { q: 'error' } }) },
      ]
      const filtered = all.filter(l => {
        const statusOk = !statusParam || statusParam === 'ALL' || l.status === statusParam
        const textOk = !q || (l.message || '').toLowerCase().includes(q.toLowerCase())
        return statusOk && textOk
      })
      const total = filtered.length
      const data = filtered.slice(skip, skip + take)
      return NextResponse.json({ data, pagination: { page, limit: take, total, totalPages: Math.max(1, Math.ceil(total / take)) } })
    }

    let where: any = { service: type }
    if (tenantId) {
      try {
        await prisma.healthLog.count({ where: tenantFilter(tenantId) as any })
        where = { ...where, ...tenantFilter(tenantId) }
      } catch {}
    }
    if (statusParam && statusParam !== 'ALL') where.status = statusParam
    if (q) where.message = { contains: q, mode: 'insensitive' as const }

    const [total, logs] = await Promise.all([
      prisma.healthLog.count({ where }),
      prisma.healthLog.findMany({ where, orderBy: { checkedAt: 'desc' }, skip, take }),
    ])

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.max(1, Math.ceil(total / take)),
      },
    })
  } catch (error) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(error, { route: 'admin/activity' }) } catch {}
    console.error('Activity API error:', error)
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 })
  }
}
