import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ROLE_PERMISSIONS, PERMISSIONS, hasPermission } from '@/lib/permissions'

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const idStr = params.userId
    const isMe = idStr === 'me'

    let user: any = null
    if (isMe) {
      const sUser = session.user as any
      user = { id: String(sUser.id ?? ''), role: sUser.role ?? 'CLIENT', name: sUser.name ?? null, email: sUser.email ?? null }
    } else {
      const id = BigInt(idStr)
      const dbUser = await prisma.user.findUnique({ where: { id } as any, select: { id: true, role: true, name: true, email: true } })
      if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      user = { ...dbUser, id: dbUser.id.toString() }
    }

    const role = user.role as keyof typeof ROLE_PERMISSIONS
    const permissions = ROLE_PERMISSIONS[role] ?? []

    return NextResponse.json({ success: true, data: { user, permissions } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load permissions' }, { status: 500 })
  }
}
