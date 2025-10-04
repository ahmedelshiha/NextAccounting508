import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { encode } from 'next-auth/jwt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE_NAME = '__Secure-next-auth.session-token'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const tenantId = body?.tenantId as string | undefined
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

    const session = await getServerSession(authOptions as any)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = String(session.user.id)

    // Verify membership
    const membership = await prisma.tenantMembership.findFirst({ where: { userId, tenantId }, include: { tenant: true } })
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Build token payload based on current session/user and include tenant metadata
    const dbUser = await prisma.user.findUnique({ where: { id: userId } })

    const tokenPayload: any = {
      name: session.user.name ?? dbUser?.name ?? null,
      email: session.user.email ?? dbUser?.email ?? null,
      picture: session.user.image ?? dbUser?.image ?? null,
      sub: userId,
      role: session.user.role ?? dbUser?.role ?? null,
      sessionVersion: dbUser?.sessionVersion ?? 0,
      tenantId: membership.tenantId,
      tenantSlug: membership.tenant?.slug ?? null,
      tenantRole: membership.role,
      iat: Math.floor(Date.now() / 1000)
    }

    // Include available tenants from DB
    const memberships = await prisma.tenantMembership.findMany({ where: { userId }, include: { tenant: true } })
    tokenPayload.availableTenants = memberships.map(m => ({ id: m.tenantId, slug: m.tenant?.slug, name: m.tenant?.name, role: m.role }))

    // Encode token
    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'NEXTAUTH_SECRET not configured' }, { status: 500 })
    }
    const encoded = await encode({ token: tokenPayload, secret: process.env.NEXTAUTH_SECRET })
    if (!encoded) return NextResponse.json({ error: 'Failed to encode token' }, { status: 500 })

    const cookie = `${COOKIE_NAME}=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax`
    const res = NextResponse.json({ success: true })
    res.headers.set('Set-Cookie', cookie)
    return res
  } catch (err) {
    console.error('tenant switch error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
