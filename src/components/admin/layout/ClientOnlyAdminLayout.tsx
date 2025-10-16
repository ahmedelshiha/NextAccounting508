/**
 * Client-Only Admin Layout
 * 
 * This component handles the client-side layout logic including:
 * - Provider initialization (realtime, permissions, etc.)
 * - Mobile responsive layout management
 * - Sidebar collapse/expand state
 * - Error boundaries and performance monitoring
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import AdminProviders from '@/components/admin/providers/AdminProviders'
import AdminHeader from '@/components/admin/layout/AdminHeader'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminFooter from '@/components/admin/layout/AdminFooter'
import AccessibleRouteAnnouncer from '@/components/providers/RouteAnnouncer'
import { useAdminLayoutStoreSSRSafe } from '@/stores/adminLayoutStoreSSRSafe'
import { LoadingSkeleton } from '@/components/admin/loading-skeleton'

interface ClientOnlyAdminLayoutProps {
  children: React.ReactNode
  session: any
}

export default function ClientOnlyAdminLayout({ children, session }: ClientOnlyAdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { sidebarCollapsed, setSidebarCollapsed } = useAdminLayoutStoreSSRSafe()
  
  // Close mobile menu on route change (handled by useEffect listening to pathname changes)
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <Suspense fallback={<LoadingShell />}>
      <AdminProviders session={session}>
        <div className="min-h-screen bg-gray-50 flex">
        <a
          href="#admin-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 focus:z-[60] rounded"
        >
          Skip to main content
        </a>
        <AccessibleRouteAnnouncer />
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar
            isCollapsed={sidebarCollapsed}
            isMobile={false}
          />
        </div>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <AdminSidebar
            isMobile={true}
            onClose={handleMobileMenuClose}
          />
        )}

        {/* Main Content Area */}
        <div
          className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          {/* Header */}
          <AdminHeader
            onMenuToggle={handleMobileMenuToggle}
            isMobileMenuOpen={isMobileMenuOpen}
          />

          {/* Main Content */}
          <main id="admin-main-content" tabIndex={-1} className="flex-1 relative overflow-hidden" role="main" aria-label="Admin dashboard content">
            <div className="h-full overflow-auto">
              <Suspense fallback={<LoadingSkeleton type="dashboard" />}>
                {children}
              </Suspense>
            </div>
          </main>

          {/* Footer */}
          <AdminFooter sidebarCollapsed={sidebarCollapsed} />
        </div>
        </div>
      </AdminProviders>
    </Suspense>
  )
}

function LoadingShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
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
