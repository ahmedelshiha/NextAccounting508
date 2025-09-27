/**
 * AdminSidebar Component
 * Fixed sidebar navigation for admin dashboard
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Menu, 
  Plus, 
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  Bell,
  User
} from 'lucide-react'
import { hasRole } from '@/lib/permissions'
import { useAdminLayoutHydrationSafe } from '@/stores/adminLayoutStoreHydrationSafe'
import type { AdminSidebarProps } from '@/types/admin/layout'

/**
 * AdminSidebar - Fixed sidebar navigation component
 * 
 * This component replaces the old floating sidebar with a properly
 * structured fixed sidebar that's part of the layout architecture.
 * 
 * Features:
 * - Fixed positioning with proper z-index management
 * - Responsive behavior (overlay on mobile, fixed on desktop)
 * - Hierarchical navigation structure
 * - Permission-based item visibility
 * - Active state management
 * - Brand section and user profile
 * - Quick action button
 */
const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  isOpen = false,
  isMobile,
  onToggle,
  onClose,
  className = '',
}) => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const { navigation } = useAdminLayoutHydrationSafe()

  // Navigation structure - this will be moved to config later
  // Dynamic badge counts - these should be fetched from APIs
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    // Fetch dynamic badge counts
    const fetchBadgeCounts = async () => {
      try {
        const [bookingsRes, serviceRequestsRes] = await Promise.allSettled([
          fetch('/api/admin/bookings/pending-count'),
          fetch('/api/admin/service-requests/pending-count')
        ])

        const counts: Record<string, number> = {}

        if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok) {
          const data = await bookingsRes.value.json()
          counts.bookings = data.count || 0
        }

        if (serviceRequestsRes.status === 'fulfilled' && serviceRequestsRes.value.ok) {
          const data = await serviceRequestsRes.value.json()
          counts['service-requests'] = data.count || 0
        }

        setBadgeCounts(counts)
      } catch (error) {
        console.warn('Failed to fetch badge counts:', error)
      }
    }

    fetchBadgeCounts()
    
    // Refresh badge counts every 5 minutes
    const interval = setInterval(fetchBadgeCounts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const navigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      exact: true
    },
    {
      id: 'bookings',
      title: 'Bookings',
      href: '/admin/bookings',
      icon: Calendar,
      badge: badgeCounts.bookings,
    },
    {
      id: 'clients',
      title: 'Clients',
      href: '/admin/clients',
      icon: Users,
    },
    {
      id: 'service-requests',
      title: 'Service Requests',
      href: '/admin/service-requests',
      icon: FileText,
      badge: badgeCounts['service-requests'],
    },
    {
      id: 'analytics',
      title: 'Analytics',
      href: '/admin/analytics',
      icon: DollarSign,
    },
    {
      id: 'settings',
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      permissions: ['ADMIN', 'TEAM_LEAD'] as const,
    },
  ]

  // Check if navigation item is active
  const isActive = (item: typeof navigationItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  // Filter items by permissions
  const visibleItems = navigationItems.filter(
    item => !item.permissions || hasRole(role, item.permissions)
  )

  // Calculate sidebar classes
  const sidebarClasses = `
    fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm z-50
    transform transition-transform duration-300 ease-in-out
    ${isMobile 
      ? `w-72 ${isOpen ? 'translate-x-0' : '-translate-x-full'}` 
      : `${collapsed ? 'w-16' : 'w-64'} translate-x-0`
    }
    ${className}
  `.trim()

  return (
    <aside
      className={sidebarClasses}
      role="navigation"
      aria-label="Admin sidebar"
    >
      {/* Brand Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg grid place-items-center flex-shrink-0">
            <span className="text-white font-bold text-sm">NA</span>
          </div>
          {(!collapsed || isMobile) && (
            <div className="ml-3 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">NextAccounting</h1>
              <p className="text-xs text-gray-500 truncate">Admin Dashboard</p>
            </div>
          )}
          {!isMobile && (
            <button
              type="button"
              onClick={onToggle}
              className="ml-auto p-2 rounded hover:bg-gray-100 transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          {isMobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-2 rounded hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {(!collapsed || isMobile) && (
        <div className="p-4 border-b border-gray-200">
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
            aria-label="Create new item"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New</span>
          </button>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto" role="navigation">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => isMobile && onClose?.()}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                  ${active 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                  ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}
                `}
                aria-current={active ? 'page' : undefined}
                title={collapsed && !isMobile ? item.title : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {(!collapsed || isMobile) && (
                    <span className="font-medium truncate">{item.title}</span>
                  )}
                </div>
                
                {(!collapsed || isMobile) && item.badge && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || session?.user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {role || 'Admin'}
              </p>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {(!collapsed || isMobile) && (
            <span className="text-xs text-gray-500">Operational</span>
          )}
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar