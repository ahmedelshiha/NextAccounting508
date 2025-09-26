/**
 * AdminHeader Component
 * Minimal header for admin dashboard with breadcrumbs, search, and user menu
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu,
  Search,
  Bell,
  ChevronRight,
  Home,
  User,
  Settings,
  LogOut,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import LogoutButton from '@/components/ui/LogoutButton'
import { useAdminLayout, useNotificationState } from '@/stores/adminLayoutStore'
import type { AdminHeaderProps } from '@/types/admin/layout'

/**
 * AdminHeader - Minimal header component for admin dashboard
 * 
 * This component provides essential header functionality without duplicating
 * the main site navigation. It includes:
 * - Sidebar toggle (mobile)
 * - Breadcrumb navigation
 * - Global search
 * - Quick actions
 * - Notification center
 * - User menu with "Back to Main Site" link
 */
const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  sidebarCollapsed,
  isMobile,
  user,
  className = '',
}) => {
  const pathname = usePathname()
  const { navigation, ui } = useAdminLayout()
  const { notifications, unreadCount } = useNotificationState()

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = (): Array<{
    label: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
    isLast?: boolean
  }> => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: Array<{
      label: string
      href: string
      icon?: React.ComponentType<{ className?: string }>
      isLast?: boolean
    }> = []

    // Always start with Admin
    breadcrumbs.push({
      label: 'Admin',
      href: '/admin',
      icon: Home,
    })

    // Add path segments
    let currentPath = ''
    for (let i = 1; i < segments.length; i++) {
      currentPath += `/${segments[i]}`
      const fullPath = `/admin${currentPath}`
      
      // Format segment name (capitalize and replace hyphens)
      const label = segments[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      breadcrumbs.push({
        label,
        href: fullPath,
        isLast: i === segments.length - 1,
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className={`bg-white border-b border-gray-200 h-16 sticky top-0 z-40 ${className}`}>
      <div className="flex items-center justify-between px-6 h-full">
        {/* Left: Sidebar toggle + Breadcrumbs */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Mobile Sidebar Toggle */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="p-2"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-1 text-sm min-w-0" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-1">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-1 flex-shrink-0" />
                  )}
                  {crumb.isLast ? (
                    <span className="text-gray-900 font-medium truncate">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1 truncate"
                    >
                      {crumb.icon && <crumb.icon className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">{crumb.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions, clients, bookings..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              aria-label="Global search"
            />
          </div>
        </div>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-3">
          {/* Back to Main Site Link */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:flex"
          >
            <Link href="/" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span>Back to Site</span>
            </Link>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative p-2" aria-label="Open notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium leading-none text-white bg-red-600 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 border-b border-gray-100 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.read ? 'bg-gray-300' : 'bg-blue-500'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2" aria-label="Open user menu">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium truncate max-w-32">
                  {user?.name || user?.email || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {(user as any)?.role || 'Admin'}
                </p>
              </div>

              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Back to Main Site</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/portal/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Account Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <LogoutButton className="flex items-center gap-2 text-red-600 w-full">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </LogoutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader