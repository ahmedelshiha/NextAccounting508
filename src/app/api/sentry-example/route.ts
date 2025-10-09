import { NextResponse } from 'next/server'

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const redirectUrl = new URL('/api/sentry-check', request.url)
  return NextResponse.redirect(redirectUrl, 307)
}
