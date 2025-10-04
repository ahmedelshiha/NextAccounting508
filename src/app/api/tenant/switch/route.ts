import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'

import { withTenantContext } from '@/lib/api-wrapper'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SESSION_COOKIE_NAME = authOptions.cookies?.sessionToken?.name ?? '__Secure-next-auth.session-token'

function createSessionCookie(value: string): string {
  const attributes = [`${SESSION_COOKIE_NAME}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  const shouldSecure = process.env.NODE_ENV === 'production' || SESSION_COOKIE_NAME.startsWith('__Secure-')
  if (shouldSecure) attributes.push('Secure')
  return attributes.join('; ')
}

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const body = await request.json().catch(() => ({}))
    const tenantId = typeof body?.tenantId === 'string' ? body.tenantId.trim() : ''
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const context = requireTenantContext()
    const userId = context.userId ? String(context.userId) : null
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.tenantMembership.findFirst({
      where: { userId, tenantId },
      include: { tenant: true },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.tenantMembership.findMany({
      where: { userId },
      include: { tenant: true },
    })

    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'NEXTAUTH_SECRET not configured' }, { status: 500 })
    }

    const tokenPayload: Record<string, any> = {
      name: dbUser.name ?? null,
      email: dbUser.email ?? null,
      picture: dbUser.image ?? null,
      sub: userId,
      role: dbUser.role ?? context.role ?? null,
      sessionVersion: dbUser.sessionVersion ?? 0,
      tenantId: membership.tenantId,
      tenantSlug: membership.tenant?.slug ?? null,
      tenantRole: membership.role,
      availableTenants: memberships.map((m) => ({
        id: m.tenantId,
        slug: m.tenant?.slug ?? null,
        name: m.tenant?.name ?? null,
        role: m.role,
      })),
      iat: Math.floor(Date.now() / 1000),
    }

    const encoded = await encode({ token: tokenPayload, secret: process.env.NEXTAUTH_SECRET })
    if (!encoded) {
      return NextResponse.json({ error: 'Failed to encode token' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true })
    response.headers.set('Set-Cookie', createSessionCookie(encoded))
    return response
  } catch (error) {
    console.error('tenant switch error', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
})
