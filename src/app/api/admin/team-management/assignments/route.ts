import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

export const GET = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  if (!hasPermission(ctx.role || undefined, PERMISSIONS.TEAM_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasDb) {
    return NextResponse.json({ data: [] })
  }
  try {
    const url = new URL(request.url)
    const memberId = url.searchParams.get('memberId')

    const where: any = {}
    if (memberId) where.assignedTeamMemberId = String(memberId)

    const rows = await prisma.serviceRequest.findMany({
      where: { ...where, ...tenantFilter(ctx.tenantId) },
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        assignedTeamMemberId: true,
        assignedAt: true,
        assignedBy: true,
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ data: rows })
  } catch (e) {
    console.error('Assignments fetch error', e)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
})
