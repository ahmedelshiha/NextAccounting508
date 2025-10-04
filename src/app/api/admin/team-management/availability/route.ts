import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

export const GET = withTenantContext(async () => {
  const ctx = requireTenantContext()
  if (!hasPermission(ctx.role || undefined, PERMISSIONS.TEAM_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasDb) {
    return NextResponse.json({ data: [], note: 'Database not configured' })
  }

  try {
    const members = await prisma.teamMember.findMany({
      where: tenantFilter(ctx.tenantId),
      select: {
        id: true,
        name: true,
        email: true,
        isAvailable: true,
        specialties: true,
        department: true,
        title: true,
        hourlyRate: true,
      },
    })

    const assignments = await prisma.serviceRequest.groupBy({
      by: ['assignedTeamMemberId'],
      where: { ...tenantFilter(ctx.tenantId), status: { in: ['ASSIGNED', 'IN_PROGRESS'] as any } },
      _count: { _all: true },
    })
    const countByMember: Record<string, number> = {}
    for (const row of assignments) {
      if (row.assignedTeamMemberId) countByMember[String(row.assignedTeamMemberId)] = Number(row._count._all)
    }

    const data = members.map(m => {
      const active = countByMember[m.id] || 0
      const maxConcurrent = 3
      const availableSlots = Math.max(0, maxConcurrent - active)
      const availabilityPercentage = Math.round((availableSlots / maxConcurrent) * 100)
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        department: m.department,
        title: m.title,
        specialties: m.specialties,
        isAvailable: m.isAvailable,
        hourlyRate: m.hourlyRate,
        activeAssignments: active,
        availabilityPercentage,
      }
    })

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Team availability error', e)
    return NextResponse.json({ error: 'Failed to compute availability' }, { status: 500 })
  }
})
