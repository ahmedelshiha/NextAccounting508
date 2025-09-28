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

import { useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import AdminProviders from '@/components/admin/providers/AdminProviders'
import AdminHeader from '@/components/admin/layout/AdminHeader'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminFooter from '@/components/admin/layout/AdminFooter'
import { useAdminLayoutStoreSSRSafe } from '@/stores/adminLayoutStoreSSRSafe'

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
    <SessionProvider session={session}>
      <AdminProviders>
        <div className="min-h-screen bg-gray-50 flex">
          <a
            href="#admin-main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 focus:z-[60] rounded"
          >
            Skip to main content
          </a>
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
                {children}
              </div>
            </main>

            {/* Footer */}
            <AdminFooter sidebarCollapsed={sidebarCollapsed} />
          </div>
        </div>
      </AdminProviders>
    </SessionProvider>
  )
}
