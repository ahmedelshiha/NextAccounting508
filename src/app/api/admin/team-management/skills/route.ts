import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TEAM_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasDb) {
    return NextResponse.json({ data: [] })
  }
  try {
    const tenantId = getTenantFromRequest(req)
    const members = await prisma.teamMember.findMany({ where: tenantFilter(tenantId), select: { id: true, name: true, specialties: true } })
    // Flatten unique skills
    const set = new Set<string>()
    members.forEach(m => (m.specialties || []).forEach(s => set.add(String(s))))
    const skills = Array.from(set).sort()
    return NextResponse.json({ data: { skills, members } })
  } catch (e) {
    console.error('Skills fetch error', e)
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasDb) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
  }
  try {
    const body = await request.json().catch(() => ({})) as { memberId?: string, specialties?: string[] }
    if (!body.memberId || !Array.isArray(body.specialties)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const tenantId = getTenantFromRequest(request)
    const updated = await prisma.teamMember.update({ where: { id: String(body.memberId), ...(tenantFilter(tenantId)) }, data: { specialties: body.specialties as any } })
    return NextResponse.json({ data: { id: updated.id, specialties: updated.specialties } })
  } catch (e) {
    console.error('Skills update error', e)
    return NextResponse.json({ error: 'Failed to update skills' }, { status: 500 })
  }
}
