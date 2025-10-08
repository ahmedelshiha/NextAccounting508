import { NextRequest, NextResponse } from 'next/server'

/**
 * Legacy compatibility handler for `/api/dev-login`.
 * Redirects callers to the canonical `/_dev/login` route.
 */
export function POST(request: NextRequest) {
  const redirectUrl = new URL('/api/_dev/login', request.url)
  return NextResponse.redirect(redirectUrl, 307)
}
