import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'

export const POST = withTenantContext(async (req: Request) => {
  // Lightweight diagnostics: check simple envs and return status. In prod hook into real checks.
  const results = {
    database: Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL),
    nextauth: Boolean(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_SECRET),
    storage: Boolean(process.env.S3_BUCKET || process.env.NETLIFY_MEDIA || process.env.AWS_BUCKET),
    integrations: { stripe: Boolean(process.env.STRIPE_SECRET) },
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json({ ok: true, results })
})
