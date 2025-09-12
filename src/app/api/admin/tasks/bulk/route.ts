import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/tasks/bulk -> body { ids: string[], updates: { status?, priority?, assignee? } }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request as unknown as Request)
    if (!rateLimit(`tasks:bulk:update:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const json = await request.json().catch(() => ({}))
    const ids = Array.isArray(json.ids) ? json.ids.filter(Boolean) : []
    const updatesIn = json.updates || {}

    if (!ids.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 })

    const data: Prisma.TaskUncheckedUpdateManyInput = {}
    if (updatesIn.status !== undefined) {
      // map client status to DB status
      const s = updatesIn.status
      data.status = s === 'completed' ? 'DONE' : s === 'in_progress' ? 'IN_PROGRESS' : 'OPEN'
    }
    if (updatesIn.priority !== undefined) {
      const p = updatesIn.priority
      data.priority = p === 'high' ? 'HIGH' : p === 'low' ? 'LOW' : 'MEDIUM'
    }
    if (updatesIn.assignee !== undefined) {
      data.assigneeId = updatesIn.assignee || null
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ updated: 0, message: 'Database not configured' }, { status: 501 })
    }

    const result = await prisma.task.updateMany({ where: { id: { in: ids } }, data })
    return NextResponse.json({ updated: result.count })
  } catch (err) {
    console.error('bulk update error', err)
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 })
  }
}

// DELETE /api/admin/tasks/bulk -> body { ids: string[] }
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request as unknown as Request)
    if (!rateLimit(`tasks:bulk:delete:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const json = await request.json().catch(() => ({}))
    const ids = Array.isArray(json.ids) ? json.ids.filter(Boolean) : []
    if (!ids.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 })

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ deleted: 0, message: 'Database not configured' }, { status: 501 })
    }

    const result = await prisma.task.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ deleted: result.count })
  } catch (err) {
    console.error('bulk delete error', err)
    return NextResponse.json({ error: 'Bulk delete failed' }, { status: 500 })
  }
}
