import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'

export const GET = withTenantContext(async () => {
  return NextResponse.json({
    clientDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    serverDsn: !!process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
  })
}, { requireAuth: false })
