import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission } from '@/lib/rbac'

export async function PATCH(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, 'manage_currencies')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code.toUpperCase()
    const body = await request.json()

    if (body.isDefault) {
      await prisma.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const updated = await prisma.currency.update({ where: { code }, data: body })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/admin/currencies/[code] error', e)
    return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 })
  }
}
