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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, role = 'STAFF', department = 'tax', title = '', userId = null } = body || {}
    if (!name || !email) return NextResponse.json({ error: 'Missing name or email' }, { status: 400 })
    const created = await prisma.teamMember.create({ data: { name, email, role, department, title, userId } })
    return NextResponse.json({ teamMember: created }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/team-members error', err)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
