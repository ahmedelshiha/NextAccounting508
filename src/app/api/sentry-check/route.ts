import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    clientDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    serverDsn: !!process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
  })
}
