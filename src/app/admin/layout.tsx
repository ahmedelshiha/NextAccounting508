import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NoSSR from '@/components/common/NoSSR'
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

  // NUCLEAR OPTION: Complete SSR suppression to eliminate all hydration issues
  const LoadingSkeleton = () => (
    <div className="h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="animate-pulse">
          <div className="p-4 border-b border-gray-200">
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="h-16 bg-white border-b border-gray-200"></div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <NoSSR fallback={<LoadingSkeleton />}>
      <ClientOnlyAdminLayout session={session}>
        {children}
      </ClientOnlyAdminLayout>
    </NoSSR>
  )
}
