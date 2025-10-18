import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'

const _api_GET = async () => {
  // In production, gather actual settings from DB/services. For now, build a minimal export.
  const payload = {
    exportedAt: new Date().toISOString(),
    env: {
      nextauth: Boolean(process.env.NEXTAUTH_URL),
      netlifyDb: Boolean(process.env.NETLIFY_DATABASE_URL),
    },
  }
  const body = JSON.stringify(payload, null, 2)
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="settings.json"',
    },
  })
}

export const GET = withTenantContext(_api_GET, { requireAuth: false })
