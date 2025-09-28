import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
export const metadata: Metadata = {
  title: 'Admin Dashboard Overview',
  description: 'Professional admin overview with live KPIs and analytics',
}

import AdminOverview from '@/components/admin/dashboard/AdminOverview'

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') redirect('/portal')
  if (!['ADMIN', 'TEAM_LEAD'].includes(role || '')) redirect('/admin/analytics')

  // Hydrate initial KPI data server-side for faster first paint
  const [bookingsRes, servicesRes, usersRes] = await Promise.all([
    fetch('/api/admin/bookings/stats', { cache: 'no-store' }),
    fetch('/api/admin/services/stats?range=90d', { cache: 'no-store' }),
    fetch('/api/admin/stats/users?range=90d', { cache: 'no-store' })
  ])

  const [bookingsJson, servicesJson, usersJson] = await Promise.all([
    bookingsRes.ok ? bookingsRes.json() : null,
    servicesRes.ok ? servicesRes.json() : null,
    usersRes.ok ? usersRes.json() : null
  ])

  return (
    <AdminOverview
      initial={{
        bookingsStats: bookingsJson ?? undefined,
        servicesStats: servicesJson ?? undefined,
        usersStats: usersJson ?? undefined,
      }}
    />
  )
}
