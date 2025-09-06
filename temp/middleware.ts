import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                      req.nextUrl.pathname.startsWith('/register')
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    const isPortalPage = req.nextUrl.pathname.startsWith('/portal')
    const isBookingPage = req.nextUrl.pathname.startsWith('/booking')

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      if (token.role === 'ADMIN' || token.role === 'STAFF') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/portal', req.url))
    }

    // Protect admin routes
    if (isAdminPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      if (token.role !== 'ADMIN' && token.role !== 'STAFF') {
        return NextResponse.redirect(new URL('/portal', req.url))
      }
    }

    // Protect portal routes
    if (isPortalPage && !isAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Allow booking page access without authentication (guest bookings)
    // if (isBookingPage && !isAuth) {
    //   return NextResponse.redirect(new URL('/login', req.url))
    // }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = ['/', '/about', '/services', '/blog', '/contact', '/booking']
        const isPublicRoute = publicRoutes.some(route => 
          req.nextUrl.pathname === route || 
          req.nextUrl.pathname.startsWith('/services/') ||
          req.nextUrl.pathname.startsWith('/blog/')
        )
        
        if (isPublicRoute) return true
        
        // For protected routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

