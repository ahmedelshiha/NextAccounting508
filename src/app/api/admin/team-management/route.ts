import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const tenantId = ctx.tenantId ?? null
    
    // Apply rate limiting
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-team-management:${ip}`, 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get team members with their assignments and workload
    // Note: TeamMember doesn't have tenantId, filter through user relation
    const teamMembers = await prisma.teamMember.findMany({
      where: tenantId ? { 
        user: {
          tenantId: tenantId
        }
      } : {},
      orderBy: { name: 'asc' },
      include: { 
        user: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            tenantId: true
          } 
        }
      },
    })

    const teamManagement = {
      teamMembers: teamMembers.map((member) => ({
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
        available: teamMembers.filter(m => m.isAvailable).length,
        departments: [...new Set(teamMembers.map(m => m.department).filter(Boolean))],
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    
    const created = await prisma.teamMember.create({ 
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json().catch(() => ({}))
    const { id, ...updateData } = body || {}
    
    if (!id) {
      return NextResponse.json({ error: 'Missing team member ID' }, { status: 400 })
    }
    
    // First check if the team member exists and belongs to the right tenant
    const existingMember = await prisma.teamMember.findFirst({
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

    const updated = await prisma.teamMember.update({
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