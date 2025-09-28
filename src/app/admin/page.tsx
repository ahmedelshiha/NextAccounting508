import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'Admin Dashboard Overview',
  description: 'Professional admin overview with live KPIs and analytics',
}

// Dynamically import client component to avoid SSR issues
const AdminOverview = dynamic(() => import('@/components/admin/dashboard/AdminOverview'), { ssr: false })

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') redirect('/portal')
  if (!['ADMIN', 'TEAM_LEAD'].includes(role || '')) redirect('/admin/analytics')

  return <AdminOverview />
}
