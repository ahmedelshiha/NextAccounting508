import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/tasks/reorder -> { updates: Array<{ id: string; boardStatus?: 'pending'|'in_progress'|'review'|'completed'|'blocked'; position: number }> }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request as unknown as Request)
    if (!rateLimit(`tasks:reorder:${ip}`, 120, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const json = await request.json().catch(() => ({})) as { updates?: Array<{ id: string; boardStatus?: string; position?: number }> }
    const updates = Array.isArray(json.updates) ? json.updates : []
    if (!updates.length) return NextResponse.json({ error: 'No updates' }, { status: 400 })

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const tx = updates.map((u) => {
      const data: import('@prisma/client').Prisma.TaskUpdateInput = {}
      if (typeof u.position === 'number' && u.position >= 0) data.position = u.position
      if (u.boardStatus) {
        data.boardStatus = u.boardStatus
        // keep coarse status in sync with board column
        const status = u.boardStatus === 'completed' ? 'DONE' : u.boardStatus === 'in_progress' ? 'IN_PROGRESS' : 'OPEN'
        data.status = status as any
      }
      return prisma.task.update({ where: { id: u.id }, data })
    })

    const results = await prisma.$transaction(tx)
    return NextResponse.json({ updated: results.length })
  } catch (error) {
    console.error('Error reordering tasks:', error)
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 })
  }
}
