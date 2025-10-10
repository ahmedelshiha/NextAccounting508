import NextAuth from 'next-auth'
import { withTenantContext } from '@/lib/api-wrapper'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const baseHandler = NextAuth(authOptions)

const handler = withTenantContext(
  (request, context) => baseHandler(request, context),
  { requireAuth: false }
)

export { handler as GET, handler as POST }
