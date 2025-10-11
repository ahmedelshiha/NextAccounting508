import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'

export const runtime = 'nodejs'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const tenantId = ctx.tenantId ?? null
    
    // Apply rate limiting
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-team-management:${ip}`, 60, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return respond.forbidden('Forbidden')
    }

    // Get team members with their assignments and workload
    const teamMemberModel = (prisma as any)?.teamMember
    if (!teamMemberModel || typeof teamMemberModel.findMany !== 'function') {
      const fallbackMembers = [
        {
          id: 'demo-team-lead',
          userId: null,
          name: 'Demo Team Lead',
          email: 'lead@example.com',
          title: 'Team Lead',
          role: 'TEAM_LEAD',
          department: 'general',
          isAvailable: true,
          status: 'active',
          workingHours: null,
          specialties: ['client onboarding'],
        },
        {
          id: 'demo-team-member',
          userId: null,
          name: 'Demo Team Member',
          email: 'member@example.com',
          title: 'Accountant',
          role: 'TEAM_MEMBER',
          department: 'general',
          isAvailable: true,
          status: 'active',
          workingHours: null,
          specialties: ['bookkeeping'],
        },
      ]
      return NextResponse.json({
        teamMembers: fallbackMembers,
        stats: {
          total: fallbackMembers.length,
          available: fallbackMembers.filter(member => member.isAvailable).length,
          departments: [...new Set(fallbackMembers.map(member => member.department).filter(Boolean))],
        },
      })
    }

    const teamMembers = await teamMemberModel.findMany({
      where: tenantId
        ? {
            user: {
              tenantId: tenantId,
            },
          }
        : {},
      orderBy: { name: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            tenantId: true,
          },
        },
      },
    })

    const teamManagement = {
      teamMembers: teamMembers.map((member: any) => ({
        id: member.id,
        userId: member.userId || null,
        name: member.name,
        email: member.email,
        title: member.title || null,
        role: member.role || null,
        department: member.department || null,
        isAvailable: !!member.isAvailable,
        status: member.status || 'active',
        workingHours: member.workingHours || null,
        specialties: Array.isArray(member.specialties) ? member.specialties : [],
      })),
      stats: {
        total: teamMembers.length,
        available: teamMembers.filter((m: any) => m.isAvailable).length,
        departments: [...new Set(teamMembers.map((m: any) => m.department).filter(Boolean))],
      }
    }

    return NextResponse.json(teamManagement)
  } catch (err) {
    console.error('GET /api/admin/team-management error', err)
    return NextResponse.json({ error: 'Failed to fetch team management data' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    const tenantId = ctx.tenantId ?? null
    
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return respond.forbidden('Forbidden')
    }
    
    const body = await req.json().catch(() => ({}))
    const { 
      name, 
      email, 
      role: memberRole = 'TEAM_MEMBER', 
      department = 'general', 
      title = '', 
      userId = null,
      specialties = []
    } = body || {}
    
    if (!name || !email) {
      return NextResponse.json({ error: 'Missing name or email' }, { status: 400 })
    }
    
    const teamMemberModel = (prisma as any)?.teamMember
    if (!teamMemberModel || typeof teamMemberModel.create !== 'function') {
      return NextResponse.json({ error: 'Team member data store unavailable' }, { status: 503 })
    }

    const created = await teamMemberModel.create({
      data: {
        name,
        email,
        role: memberRole,
        department,
        title,
        userId,
        specialties,
        isAvailable: true,
        status: 'active'
        // Note: TeamMember doesn't have tenantId field directly
      }
    })
    
    return NextResponse.json({ teamMember: created }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/team-management error', err)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    const tenantId = ctx.tenantId ?? null
    
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return respond.forbidden('Forbidden')
    }
    
    const body = await req.json().catch(() => ({}))
    const { id, ...updateData } = body || {}
    
    if (!id) {
      return NextResponse.json({ error: 'Missing team member ID' }, { status: 400 })
    }
    
    const teamMemberModel = (prisma as any)?.teamMember
    if (!teamMemberModel || typeof teamMemberModel.findFirst !== 'function' || typeof teamMemberModel.update !== 'function') {
      return NextResponse.json({ error: 'Team member data store unavailable' }, { status: 503 })
    }

    // First check if the team member exists and belongs to the right tenant
    const existingMember = await teamMemberModel.findFirst({
      where: {
        id,
        ...(tenantId && {
          user: {
            tenantId: tenantId
          }
        })
      }
    })

    if (!existingMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const updated = await teamMemberModel.update({
      where: {
        id
      },
      data: updateData
    })
    
    return NextResponse.json({ teamMember: updated })
  } catch (err) {
    console.error('PUT /api/admin/team-management error', err)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
})
