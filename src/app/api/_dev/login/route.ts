import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { encode } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE_NAME = '__Secure-next-auth.session-token'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not allowed in production' }, { status: 403 })
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ success: false, error: 'NEXTAUTH_SECRET not configured' }, { status: 500 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const email = (body?.email as string) || 'staff@accountingfirm.com'
    const tenantSlug = typeof body?.tenantSlug === 'string' && body.tenantSlug.trim().length > 0 ? body.tenantSlug.trim() : 'primary'
    const tenantIdOverride = typeof body?.tenantId === 'string' && body.tenantId.trim().length > 0 ? body.tenantId.trim() : null

    const tenantLookup = tenantIdOverride
      ? await prisma.tenant.findUnique({ where: { id: tenantIdOverride } })
      : await prisma.tenant.findUnique({ where: { slug: tenantSlug } })

    const tenant = tenantLookup ?? (await prisma.tenant.findFirst())

    const user =
      (tenant
        ? await prisma.user.findUnique({
            where: { tenantId_email: { tenantId: tenant.id, email } },
          })
        : null) ?? (await prisma.user.findFirst({ where: { email } }))

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const activeTenantId = tenant?.id ?? user.tenantId ?? null
    const activeTenantSlug = tenant?.slug ?? null

    const tokenPayload = {
      name: user.name,
      email: user.email,
      picture: user.image || null,
      sub: user.id,
      role: user.role,
      sessionVersion: user.sessionVersion ?? 0,
      tenantId: activeTenantId,
      tenantSlug: activeTenantSlug,
      iat: Math.floor(Date.now() / 1000),
    }

    const encoded = await encode({ token: tokenPayload as any, secret: process.env.NEXTAUTH_SECRET })
    if (!encoded) {
      return NextResponse.json({ success: false, error: 'Failed to encode token' }, { status: 500 })
    }

    const cookie = `${COOKIE_NAME}=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax`

    const res = NextResponse.json({ success: true, cookie: cookie, token: encoded })
    res.headers.set('Set-Cookie', cookie)
    return res
  } catch (e) {
     
    console.error('dev login error', e)
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 })
  }
}
