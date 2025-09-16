import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { fetchRates } from '@/lib/exchange'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const base = (body.base as string) || process.env.EXCHANGE_BASE_CURRENCY || 'USD'
    const targets = (body.targets as string[]) || []

    if (targets.length === 0) {
      const active = await prisma.currency.findMany({ where: { active: true } })
      for (const t of active) {
        if (t.code !== base) targets.push(t.code)
      }
    }

    const res = await fetchRates(targets, base)
    return NextResponse.json(res)
  } catch (e) {
    console.error('POST /api/admin/currencies/refresh error', e)
    return NextResponse.json({ error: 'Failed to refresh rates' }, { status: 500 })
  }
}
