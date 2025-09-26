/**
 * Lazy-loaded Admin Dashboard Layout
 * Implements dynamic imports and code splitting for optimal performance
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import React, { Suspense, lazy } from 'react'
import type { AdminDashboardLayoutProps } from '@/types/admin/layout'

// Lazy load heavy admin components
const AdminDashboardLayout = lazy(() => import('./AdminDashboardLayout'))

/**
 * Loading Skeleton for Admin Dashboard
 * Shows while the main admin layout is being loaded
 */
const AdminLayoutSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex">
    {/* Sidebar Skeleton */}
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      {/* Brand Section Skeleton */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse" />
          <div className="ml-3">
            <div className="w-16 h-4 bg-gray-300 rounded animate-pulse mb-1" />
            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="p-4 border-b border-gray-200">
        <div className="w-full h-9 bg-gray-300 rounded-lg animate-pulse" />
      </div>

      {/* Navigation Skeleton */}
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="flex items-center gap-3 px-3 py-2">
            <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
            <div className="w-20 h-4 bg-gray-300 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="flex-1">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-12 h-4 bg-gray-300 rounded animate-pulse" />
            <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-64 h-9 bg-gray-300 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
          <div className="w-24 h-8 bg-gray-300 rounded animate-pulse" />
        </div>
      </div>

      {/* Page Content Skeleton */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="w-32 h-6 bg-gray-300 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            <div className="w-full h-40 bg-gray-300 rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              <div className="w-full h-24 bg-gray-300 rounded-lg animate-pulse" />
              <div className="w-full h-24 bg-gray-300 rounded-lg animate-pulse" />
              <div className="w-full h-24 bg-gray-300 rounded-lg animate-pulse" />
            </div>
            <div className="w-full h-60 bg-gray-300 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

/**
 * Error Boundary for Admin Layout
 * Handles lazy loading errors gracefully
 */
class AdminLayoutErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Layout failed to load:', error)
    
    // Send error to monitoring if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag
      gtag('event', 'admin_layout_error', {
        event_category: 'error',
        event_label: error.message,
        value: 1,
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Admin Dashboard Loading Error
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error loading the admin dashboard. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * AdminDashboardLayoutLazy - Performance-optimized layout wrapper
 * 
 * This component implements:
 * - Code splitting for admin components
 * - Lazy loading with suspense boundaries
 * - Loading skeletons for better UX
 * - Error boundaries for resilient loading
 * - Performance monitoring hooks
 */
const AdminDashboardLayoutLazy: React.FC<AdminDashboardLayoutProps> = (props) => {
  return (
    <AdminLayoutErrorBoundary>
      <Suspense fallback={<AdminLayoutSkeleton />}>
        <AdminDashboardLayout {...props} />
      </Suspense>
    </AdminLayoutErrorBoundary>
  )
}

export default AdminDashboardLayoutLazy