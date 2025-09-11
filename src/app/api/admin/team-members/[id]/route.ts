import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import prisma from '@/lib/prisma'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await context.params
    const body = await request.json()

    try {
      const updated = await prisma.teamMember.update({
        where: { id },
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          role: body.role,
          department: body.department,
          title: body.title,
          status: body.status,
          experienceYears: body.experienceYears != null ? Number(body.experienceYears) : undefined,
          hourlyRate: body.hourlyRate != null ? Number(body.hourlyRate) : undefined,
          specialties: Array.isArray(body.specialties) ? body.specialties : undefined,
          certifications: Array.isArray(body.certifications) ? body.certifications : undefined,
          workingHours: body.workingHours,
          isAvailable: typeof body.isAvailable === 'boolean' ? body.isAvailable : undefined,
          canManageBookings: typeof body.canManageBookings === 'boolean' ? body.canManageBookings : undefined,
          canViewAllClients: typeof body.canViewAllClients === 'boolean' ? body.canViewAllClients : undefined,
          notificationSettings: body.notificationSettings,
          availabilityNotes: body.availabilityNotes,
          notes: body.notes,
          lastActive: new Date(),
        },
        include: { stats: true }
      })
      return NextResponse.json({ teamMember: {
        ...updated,
        hourlyRate: updated.hourlyRate != null ? Number(updated.hourlyRate) : null
      } })
    } catch (_err) {
      return NextResponse.json({ error: 'DB not available, cannot persist update' }, { status: 503 })
    }
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  void request
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await context.params

    try {
      await prisma.teamMember.delete({ where: { id } })
      return NextResponse.json({ message: 'Team member removed' })
    } catch (_err) {
      return NextResponse.json({ error: 'DB not available, cannot delete' }, { status: 503 })
    }
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}
