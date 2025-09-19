import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TEAM_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const members = await prisma.teamMember.findMany({ select: { id: true, isAvailable: true } })
    const activeMembers = members.length

    const byMember = await prisma.serviceRequest.groupBy({
      by: ['assignedTeamMemberId','priority','status'],
      where: { status: { in: ['ASSIGNED','IN_PROGRESS','COMPLETED'] as any } },
      _count: { _all: true }
    })

    const distMap: Record<string, { memberId: string, assigned: number, inProgress: number, completed: number }> = {}
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
    const capacity = activeMembers * 3 // assume 3 concurrent capacity per member until field exists
    const utilization = capacity ? Math.round((totalActiveWork / capacity) * 100) : 0

    return NextResponse.json({ data: { utilization, activeMembers, distribution } })
  } catch (e) {
    // Fallback when DB not available
    return NextResponse.json({ data: { utilization: 0, activeMembers: 0, distribution: [] }, note: 'Workload fallback (no DB)' })
  }
}
