import { NextRequest, NextResponse } from 'next/server'
import * as NextServer from 'next/server'
import { getToken } from 'next-auth/jwt'

function isStaffRole(role: string | undefined | null) {
  return role === 'ADMIN' || role === 'TEAM_LEAD' || role === 'TEAM_MEMBER'
}

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isAdminPage = pathname.startsWith('/admin')
  const isPortalPage = pathname.startsWith('/portal')

  if (isAuthPage && isAuth) {
    const role = (token as unknown as { role?: string } | null)?.role
    const dest = isStaffRole(role) ? '/admin' : '/portal'
    return NextServer.NextResponse.redirect(new URL(dest, req.url))
  }

  if (isAdminPage) {
    if (!isAuth) return NextServer.NextResponse.redirect(new URL('/login', req.url))
    const role = (token as unknown as { role?: string } | null)?.role
    if (!isStaffRole(role)) {
      return NextServer.NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  if (isPortalPage && !isAuth) {
    return NextServer.NextResponse.redirect(new URL('/login', req.url))
  }

  const res = NextServer.NextResponse.next()

  // Prevent caching of sensitive pages
  if (isAdminPage || isPortalPage) {
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('Pragma', 'no-cache')
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/register'],
}
