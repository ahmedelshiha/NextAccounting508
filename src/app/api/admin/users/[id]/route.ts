import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role ?? ''
    if (!session?.user || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const id = params.id
    const body = await request.json().catch(() => ({}))
    const { role: newRole } = body || {}

    if (!newRole || !['ADMIN', 'STAFF', 'CLIENT'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid or missing role' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
