import { Metadata } from 'next'
import { authOptions, getSessionOrBypass } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import AdminOverview from '@/components/admin/dashboard/AdminOverview\'\nimport AdminErrorBoundary from \'@/components/admin/layout/AdminErrorBoundary'
import { Suspense } from 'react'
import { LoadingSkeleton } from '@/components/admin/loading-skeleton'

export const metadata: Metadata = {
  title: 'Admin Dashboard Overview',
  description: 'Professional admin overview with live KPIs and analytics',
}

export default async function AdminOverviewPage() {
  const session = await getSessionOrBypass()
  if (!session?.user) redirect('/login')

  const role = typeof (session.user as any)?.role === 'string' ? (session.user as any).role.toUpperCase() : undefined
  if (role === 'CLIENT') redirect('/portal')
  if (!['ADMIN', 'TEAM_LEAD', 'SUPER_ADMIN'].includes(role || '')) redirect('/admin/analytics')

  // Hydrate initial KPI data server-side for faster first paint (do not throw on failures)
  let bookingsJson: any = null
  let servicesJson: any = null
  let usersJson: any = null
  try {
    const hdrs = await headers()
    const proto = hdrs.get('x-forwarded-proto') || 'http'
    const host = hdrs.get('host') || ''
    const origin = `${proto}://${host}`

    const forwardHeaders: Record<string, string> = {}
    const cookie = hdrs.get('cookie')
    if (cookie) forwardHeaders['cookie'] = cookie
    const tenant = hdrs.get('x-tenant-id')
    if (tenant) forwardHeaders['x-tenant-id'] = tenant
    const reqId = hdrs.get('x-request-id')
    if (reqId) forwardHeaders['x-request-id'] = reqId

    const TIMEOUT_MS = Number(process.env.ADMIN_SSR_FETCH_TIMEOUT_MS || 9000)

    const safeFetch = async (url: string) => {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
        const res = await fetch(url, {
          cache: 'no-store',
          headers: forwardHeaders,
          next: { revalidate: 0 },
          signal: controller.signal,
        })
        clearTimeout(timer)
        return res
      } catch {
        // Soft-fail to avoid SSR 504s and hydration mismatches; client will refetch
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
    }

    const [bookingsRes, servicesRes, usersRes] = await Promise.all([
      safeFetch(`${origin}/api/admin/bookings/stats`),
      safeFetch(`${origin}/api/admin/services/stats?range=90d`),
      safeFetch(`${origin}/api/admin/stats/users?range=90d`)
    ])

    const [b, s, u] = await Promise.all([
      bookingsRes.ok ? bookingsRes.json().catch(() => null) : null,
      servicesRes.ok ? servicesRes.json().catch(() => null) : null,
      usersRes.ok ? usersRes.json().catch(() => null) : null
    ])
    bookingsJson = b
    servicesJson = s
    usersJson = u
  } catch {
    // swallow to keep server render resilient
  }

  return (
    <AdminErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="dashboard" />}>
        <AdminOverview
          initial={{
            bookingsStats: bookingsJson ?? undefined,
            servicesStats: servicesJson ?? undefined,
            usersStats: usersJson ?? undefined,
          }}
        />
      </Suspense>
    </AdminErrorBoundary>
  )
}
