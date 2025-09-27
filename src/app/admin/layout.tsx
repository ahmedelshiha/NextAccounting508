import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientOnlyAdminLayout from '@/components/admin/layout/ClientOnlyAdminLayout'

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

  // Use client-only admin layout to completely eliminate hydration conflicts
  return (
    <ClientOnlyAdminLayout session={session}>
      {children}
    </ClientOnlyAdminLayout>
  )
}
