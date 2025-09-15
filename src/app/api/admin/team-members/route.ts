import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rows = await prisma.teamMember.findMany({
      orderBy: { name: 'asc' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    })
    let teamMembers = rows.map(r => ({
      id: r.id,
      userId: r.userId || r.user?.id || null,
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

    if (!teamMembers.length) {
      try {
        const users = await prisma.user.findMany({
          where: { role: { in: ['ADMIN','STAFF'] as any } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, role: true }
        })
        teamMembers = users.map(u => ({
          id: `user_${u.id}`,
          userId: u.id,
          name: u.name || u.email || 'User',
          email: u.email || '',
          title: null,
          role: u.role || 'STAFF',
          department: null,
          isAvailable: true,
          status: 'active',
          workingHours: null,
          specialties: [],
        }))
      } catch {}
    }

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
    const created = await prisma.teamMember.create({ data: { name, email, role, department, title, userId } as any })
    return NextResponse.json({ teamMember: created }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/team-members error', err)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
