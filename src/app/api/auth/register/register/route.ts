import { NextRequest, NextResponse } from 'next/server'

/**
 * Legacy handler preserving compatibility for `/api/auth/register/register`.
 * Redirects POST requests to the canonical `/api/auth/register` endpoint.
 */
export function POST(request: NextRequest) {
  const redirectUrl = new URL('/api/auth/register', request.url)
  return NextResponse.redirect(redirectUrl, 307)
}
