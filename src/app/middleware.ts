import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { buildCorsHeaders, corsPreflight } from '@/lib/cors'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // CORS for API routes (allows Builder.io preview and Netlify to call dev APIs)
  if (pathname.startsWith('/api')) {
    if (req.method === 'OPTIONS') return corsPreflight(req)
    const res = NextResponse.next()
    const cors = buildCorsHeaders(req)
    cors.forEach((v, k) => res.headers.set(k, v))
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
    return NextResponse.redirect(new URL(dest, req.url))
  }

  if (isAdminPage) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url))
    const role = (token as unknown as { role?: string } | null)?.role
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  if (isPortalPage && !isAuth) {
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
