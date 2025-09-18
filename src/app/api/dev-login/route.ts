import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { encode } from 'next-auth/jwt'

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
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const tokenPayload = {
      name: user.name,
      email: user.email,
      picture: user.image || null,
      sub: user.id,
      role: user.role,
      sessionVersion: user.sessionVersion ?? 0,
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
    // eslint-disable-next-line no-console
    console.error('dev login error', e)
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 })
  }
}
