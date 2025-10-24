import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365)
    const tenantId = ctx.tenantId
    if (!tenantId) return Response.json({ error: 'Tenant context required' }, { status: 400 })

    const now = new Date()
    const since = new Date()
    since.setDate(now.getDate() - days)

    // DAU: users with lastLoginAt within 24 hours
    const dauSince = new Date(now)
    dauSince.setDate(now.getDate() - 1)

    const dau = await prisma.userProfile.count({ where: { user: { tenantId }, lastLoginAt: { gte: dauSince } } })
    const mau = await prisma.userProfile.count({ where: { user: { tenantId }, lastLoginAt: { gte: since } } })
    const totalUsers = await prisma.userProfile.count({ where: { user: { tenantId } } })

    return Response.json({
      success: true,
      data: {
        days,
        dau,
        mau,
        totalUsers,
        dauPct: totalUsers ? ((dau / totalUsers) * 100).toFixed(2) : '0',
        mauPct: totalUsers ? ((mau / totalUsers) * 100).toFixed(2) : '0',
      },
    })
  } catch (error: any) {
    console.error('Failed to get engagement analytics:', error)
    return Response.json({ error: error.message || 'Failed to get engagement analytics' }, { status: 500 })
  }
})
