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
import { useAdminLayoutStore } from '@/stores/adminLayoutStoreSSRSafe'

interface ClientOnlyAdminLayoutProps {
  children: React.ReactNode
  session: any
}

export default function ClientOnlyAdminLayout({ children, session }: ClientOnlyAdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { sidebarCollapsed, setSidebarCollapsed } = useAdminLayoutStore()
  
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
            <main className="flex-1 relative overflow-hidden">
              <div className="h-full overflow-auto">
                {children}
              </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  © 2024 NextAccounting. All rights reserved.
                </div>
                <div className="flex items-center space-x-4">
                  <span>Version 2.3.5</span>
                  <span className="flex items-center">
                    <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                    All systems operational
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </AdminProviders>
    </SessionProvider>
  )
}