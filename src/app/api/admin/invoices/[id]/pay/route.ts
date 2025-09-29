import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user?.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) return NextResponse.json({ error: 'Database not configured' }, { status: 501 })

    const { id } = await context.params
    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    if ((existing as any).status === 'PAID') {
      return NextResponse.json({ message: 'Already paid', invoice: existing })
    }

    const updated = await prisma.invoice.update({ where: { id }, data: { status: 'PAID' as any, paidAt: new Date() } })
    await logAudit({ action: 'invoice.pay', actorId: session.user.id, targetId: id })

    return NextResponse.json({ message: 'Invoice marked as paid', invoice: updated })
  } catch (error) {
    console.error('Error marking invoice paid:', error)
    return NextResponse.json({ error: 'Failed to mark invoice as paid' }, { status: 500 })
  }
}
