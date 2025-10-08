import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Legacy compatibility endpoint for `/api/auth/register/register`.
 * Preserves older clients by redirecting (307) to the canonical `/api/auth/register`.
 */
export function POST(request: NextRequest) {
  const redirectUrl = new URL('/api/auth/register', request.url)
  return NextResponse.redirect(redirectUrl, 307)
}

export function GET(request: NextRequest) {
  const redirectUrl = new URL('/api/auth/register', request.url)
  return NextResponse.redirect(redirectUrl, 307)
}
