'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { AdminDashboardLayoutProps } from '@/types/admin/layout'

/**
 * Loading component for admin dashboard
 */
const AdminDashboardLoadingFallback = () => (
  <div className="h-screen bg-gray-50 flex">
    {/* Sidebar Skeleton */}
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
    
    {/* Content Skeleton */}
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

/**
 * Error fallback component
 */
const AdminDashboardErrorFallback = () => (
  <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="mb-4">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      <h1 className="text-lg font-semibold text-gray-900 mb-2">
        Admin Dashboard Loading Error
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        There was an error loading the admin dashboard. Please try refreshing the page.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Refresh Page
      </button>
    </div>
  </div>
)

/**
 * Dynamically import AdminDashboardLayout with SSR disabled
 * This completely eliminates hydration mismatches by rendering only on client
 */
const DynamicAdminDashboardLayout = dynamic(
  () => import('./AdminDashboardLayout'),
  {
    ssr: false, // Disable server-side rendering
    loading: AdminDashboardLoadingFallback,
  }
)

/**
 * Client-only wrapper for AdminDashboardLayout
 * This component ensures the admin dashboard only renders on the client side,
 * completely eliminating any possibility of hydration mismatches
 */
const ClientOnlyAdminLayout: React.FC<AdminDashboardLayoutProps> = (props) => {
  const [isClient, setIsClient] = useState(false)

  // Ensure we only render on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading skeleton during SSR and initial client load
  if (!isClient) {
    return <AdminDashboardLoadingFallback />
  }

  return (
    <Suspense fallback={<AdminDashboardLoadingFallback />}>
      <DynamicAdminDashboardLayout {...props} />
    </Suspense>
  )
}

export default ClientOnlyAdminLayout