import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { encode } from 'next-auth/jwt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE_NAME = '__Secure-next-auth.session-token'
const DEFAULT_EMAIL = 'staff@accountingfirm.com'
const DEFAULT_TENANT_SLUG = 'primary'

interface DevLoginRequestPayload {
  email?: string
  tenantSlug?: string
  tenantId?: string
  token?: string
}

/**
 * Issues a development-only session cookie for testing flows without standard authentication.
 * Never available in production and optionally gated by DEV_LOGIN_TOKEN.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not allowed in production' },
      { status: 403 },
    )
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { success: false, error: 'NEXTAUTH_SECRET not configured' },
      { status: 500 },
    )
  }

  let body: DevLoginRequestPayload = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const expectedToken = process.env.DEV_LOGIN_TOKEN
  if (expectedToken) {
    const providedToken =
      request.headers.get('x-dev-login-token') ??
      (typeof body.token === 'string' ? body.token : null)

    if (providedToken !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid dev login token' },
        { status: 403 },
      )
    }
  }

  try {
    const email =
      typeof body.email === 'string' && body.email.trim().length > 0
        ? body.email.trim().toLowerCase()
        : DEFAULT_EMAIL

    const tenantSlug =
      typeof body.tenantSlug === 'string' && body.tenantSlug.trim().length > 0
        ? body.tenantSlug.trim()
        : DEFAULT_TENANT_SLUG

    const tenantIdOverride =
      typeof body.tenantId === 'string' && body.tenantId.trim().length > 0
        ? body.tenantId.trim()
        : null

    const tenantCandidate = tenantIdOverride
      ? await prisma.tenant.findUnique({ where: { id: tenantIdOverride } })
      : await prisma.tenant.findUnique({ where: { slug: tenantSlug } })

    const tenant = tenantCandidate ?? (await prisma.tenant.findFirst())
    const tenantId = tenant?.id ?? null
    const tenantSlugResolved = tenant?.slug ?? null

    const user = tenantId
      ? await prisma.user.findUnique({
          where: { tenantId_email: { tenantId, email } },
        })
      : await prisma.user.findFirst({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      )
    }

    const tokenPayload = {
      name: user.name,
      email: user.email,
      picture: user.image ?? null,
      sub: user.id,
      role: user.role,
      tenantRole: user.tenantRole ?? null,
      sessionVersion: user.sessionVersion ?? 0,
      tenantId,
      tenantSlug: tenantSlugResolved,
      iat: Math.floor(Date.now() / 1000),
    }

    const encoded = await encode({ token: tokenPayload as any, secret: process.env.NEXTAUTH_SECRET })
    if (!encoded) {
      return NextResponse.json(
        { success: false, error: 'Failed to encode token' },
        { status: 500 },
      )
    }

    const cookie = `${COOKIE_NAME}=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax`
    const response = NextResponse.json({ success: true, token: encoded, cookie })
    response.headers.set('Set-Cookie', cookie)
    return response
  } catch (error) {
    console.error('dev login error', error)
    return NextResponse.json(
      { success: false, error: 'internal' },
      { status: 500 },
    )
  }
}
