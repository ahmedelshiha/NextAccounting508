import { Metadata } from 'next'
import { authOptions, getSessionOrBypass } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import AdminOverview from '@/components/admin/dashboard/AdminOverview'
import AdminErrorBoundary from '@/components/admin/layout/AdminErrorBoundary'

export const metadata: Metadata = {
  title: 'Admin Dashboard Overview',
  description: 'Professional admin overview with live KPIs and analytics',
}

export default async function AdminOverviewPage() {
  const session = await getSessionOrBypass()
  if (!session?.user) redirect('/login')

  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') redirect('/portal')
  if (!['ADMIN', 'TEAM_LEAD'].includes(role || '')) redirect('/admin/analytics')

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

    const [bookingsRes, servicesRes, usersRes] = await Promise.all([
      fetch(`${origin}/api/admin/bookings/stats`, { cache: 'no-store', headers: forwardHeaders, next: { revalidate: 0 } }).catch(() => new Response(null, { status: 503 })),
      fetch(`${origin}/api/admin/services/stats?range=90d`, { cache: 'no-store', headers: forwardHeaders, next: { revalidate: 0 } }).catch(() => new Response(null, { status: 503 })),
      fetch(`${origin}/api/admin/stats/users?range=90d`, { cache: 'no-store', headers: forwardHeaders, next: { revalidate: 0 } }).catch(() => new Response(null, { status: 503 }))
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
      <AdminOverview
        initial={{
          bookingsStats: bookingsJson ?? undefined,
          servicesStats: servicesJson ?? undefined,
          usersStats: usersJson ?? undefined,
        }}
      />
    </AdminErrorBoundary>
  )
}
