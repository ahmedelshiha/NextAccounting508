import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

export const GET = withTenantContext(async () => {
  const ctx = requireTenantContext()
  if (!hasPermission(ctx.role || undefined, PERMISSIONS.TEAM_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hasDb = !!process.env.NETLIFY_DATABASE_URL
  if (!hasDb) {
    return NextResponse.json({ data: { utilization: 0, activeMembers: 0, distribution: [] }, note: 'Workload fallback (no DB)' })
  }

  try {
    const members = await prisma.teamMember.findMany({ where: tenantFilter(ctx.tenantId), select: { id: true, isAvailable: true } })
    const activeMembers = members.length

    const byMember = await prisma.serviceRequest.groupBy({
      by: ['assignedTeamMemberId', 'priority', 'status'],
      where: { ...tenantFilter(ctx.tenantId), status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] as any } },
      _count: { _all: true },
    })

    const distMap: Record<string, { memberId: string; assigned: number; inProgress: number; completed: number }> = {}
    for (const row of byMember) {
      const id = String(row.assignedTeamMemberId)
      if (!id) continue
      distMap[id] ||= { memberId: id, assigned: 0, inProgress: 0, completed: 0 }
      if (row.status === 'ASSIGNED') distMap[id].assigned += Number(row._count._all)
      else if (row.status === 'IN_PROGRESS') distMap[id].inProgress += Number(row._count._all)
      else if (row.status === 'COMPLETED') distMap[id].completed += Number(row._count._all)
    }

    const distribution = Object.values(distMap)
    const totalActiveWork = distribution.reduce((sum, d) => sum + d.assigned + d.inProgress, 0)
    const capacity = activeMembers * 3
    const utilization = capacity ? Math.round((totalActiveWork / capacity) * 100) : 0

    return NextResponse.json({ data: { utilization, activeMembers, distribution } })
  } catch (e) {
    return NextResponse.json({ data: { utilization: 0, activeMembers: 0, distribution: [] }, note: 'Workload fallback (no DB)' })
  }
})
