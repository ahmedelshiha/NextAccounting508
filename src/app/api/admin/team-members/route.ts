import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rows = await prisma.teamMember.findMany({ orderBy: { name: 'asc' } })
    const teamMembers = rows.map(r => ({
      id: r.id,
      userId: r.userId || null,
      name: r.name,
      email: r.email,
      title: r.title || null,
      role: r.role || null,
      department: r.department || null,
      isAvailable: !!r.isAvailable,
      status: r.status || 'active',
      workingHours: r.workingHours || null,
      specialties: Array.isArray(r.specialties) ? r.specialties : [],
    }))
    return NextResponse.json({ teamMembers })
  } catch (err) {
    console.error('GET /api/admin/team-members error', err)
    return NextResponse.json({ error: 'Failed to list team members' }, { status: 500 })
  }
}
