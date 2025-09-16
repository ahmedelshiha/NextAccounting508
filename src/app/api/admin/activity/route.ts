import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET /api/admin/activity?type=AUDIT&limit=20
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const type = (searchParams.get('type') || 'AUDIT').toUpperCase()
    const take = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      const fallback = [
        { id: 'a1', checkedAt: new Date().toISOString(), service: type, status: 'INFO', message: JSON.stringify({ action: 'demo.action', details: {} }) },
      ]
      return NextResponse.json(fallback)
    }

    const logs = await prisma.healthLog.findMany({
      where: { service: type },
      orderBy: { checkedAt: 'desc' },
      take,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 })
  }
}
