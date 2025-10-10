import { withTenantContext } from '@/lib/api-wrapper'

export const GET = withTenantContext(async (request: Request) => {
  const redirectUrl = new URL('/api/sentry-check', request.url)
  return Response.redirect(redirectUrl, 307)
}, { requireAuth: false })
