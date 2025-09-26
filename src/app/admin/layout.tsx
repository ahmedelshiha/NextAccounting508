import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboardLayoutLazy from '@/components/admin/layout/AdminDashboardLayoutLazy'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Administrative control panel',
}

interface Props { children: React.ReactNode }

export default async function AdminLayout({ children }: Props) {
  // Server-side auth guard: require an authenticated session
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    // Not signed in → send to login
    redirect('/login')
  }

  // Basic role gate: keep clients in the portal; staff/admin may access admin area
  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') {
    redirect('/portal')
  }

  // Use simplified admin layout to avoid hydration conflicts
  return (
    <AdminDashboardLayoutLazy session={session}>
      {children}
    </AdminDashboardLayoutLazy>
  )
}
