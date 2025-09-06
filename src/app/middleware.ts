import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const { pathname } = req.nextUrl

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
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
