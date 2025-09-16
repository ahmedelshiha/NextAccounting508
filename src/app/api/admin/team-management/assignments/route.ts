import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['ADMIN','STAFF'].includes(String(session.user.role))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasDb) {
    return NextResponse.json({ data: [] })
  }
  try {
    const url = new URL(request.url)
    const memberId = url.searchParams.get('memberId')

    const where: any = {}
    if (memberId) where.assignedTeamMemberId = String(memberId)

    const rows = await prisma.serviceRequest.findMany({
      where,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        assignedTeamMemberId: true,
        assignedAt: true,
        assignedBy: true,
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ data: rows })
  } catch (e) {
    console.error('Assignments fetch error', e)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
