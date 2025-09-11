import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { buildCorsHeaders, corsPreflight } from '@/lib/cors'
import { rateLimit } from '@/lib/rate-limit'
import { logInfo } from '@/lib/log'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // CORS + basic rate limiting for API routes
  if (pathname.startsWith('/api')) {
    if (req.method === 'OPTIONS') return corsPreflight(req)

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown'
    const key = `${ip}:${pathname}`
    const { allowed, remaining, resetInMs } = await rateLimit(key, 120, 60)
    if (!allowed) {
      const h = buildCorsHeaders(req)
      h.set('Retry-After', String(Math.ceil(resetInMs / 1000)))
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), { status: 429, headers: h })
    }

    const res = NextResponse.next()
    const cors = buildCorsHeaders(req)
    cors.forEach((v, k) => res.headers.set(k, v))
    res.headers.set('X-RateLimit-Remaining', String(remaining))
    return res
  }

  // Auth/role-based redirects for application pages
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isAdminPage = pathname.startsWith('/admin')
  const isPortalPage = pathname.startsWith('/portal')

  if (isAuthPage && isAuth) {
    const role = (token as unknown as { role?: string } | null)?.role
    const dest = role === 'ADMIN' || role === 'STAFF' ? '/admin' : '/portal'
    logInfo('middleware.redirect.authenticated', { dest, role })
    return NextResponse.redirect(new URL(dest, req.url))
  }

  if (isAdminPage) {
    if (!isAuth) {
      logInfo('middleware.redirect.admin_not_auth')
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const role = (token as unknown as { role?: string } | null)?.role
    if (role !== 'ADMIN' && role !== 'STAFF') {
      logInfo('middleware.redirect.admin_wrong_role', { role })
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  if (isPortalPage && !isAuth) {
    logInfo('middleware.redirect.portal_not_auth')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
