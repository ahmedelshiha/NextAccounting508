import { Metadata } from 'next'
import { authOptions, getSessionOrBypass } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientOnlyAdminLayout from '@/components/admin/layout/ClientOnlyAdminLayout'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Admin Dashboard - NextAccounting',
  description: 'Professional administrative control panel with real-time analytics and business management tools',
}

interface Props { 
  children: React.ReactNode 
}

/**
 * Modern Admin Layout
 * 
 * Professional server-side layout with client-side enhancements:
 * - Server-side authentication and role validation
 * - Client-side providers for realtime updates
 * - Professional sidebar navigation
 * - Responsive header with breadcrumbs
 * - Error boundaries and performance monitoring
 */
export default async function AdminLayout({ children }: Props) {
  // Server-side authentication guard
  const session = await getSessionOrBypass()
  if (!session?.user) {
    redirect('/login')
  }

  // Role-based access control
  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') {
    redirect('/portal')
  }

  // Pass session to client layout for initialization
  return (
    <Suspense fallback={<AdminLayoutSkeleton />}>
      <ClientOnlyAdminLayout session={session}>
        {children}
      </ClientOnlyAdminLayout>
    </Suspense>
  )
}

function AdminLayoutSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="h-8 bg-gray-200 rounded mb-6 animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded mb-2 animate-pulse" />
        ))}
      </div>
      <div className="flex-1 p-8">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-lg shadow animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-lg shadow animate-pulse" />
      </div>
    </div>
  )
}
