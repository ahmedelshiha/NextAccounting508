/**
 * Admin Header Component
 * 
 * Professional header for the admin dashboard with:
 * - Breadcrumb navigation
 * - User profile dropdown
 * - Notifications bell
 * - Search functionality
 * - Mobile menu toggle
 */

'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Bell,
  Search,
  Menu,
  Home,
  ChevronLeft,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientNotifications } from '@/hooks/useClientNotifications'
import Link from 'next/link'
import QuickLinks from './Footer/QuickLinks'
import UserProfileDropdown from './Header/UserProfileDropdown'
import ProfileManagementPanel from '../profile/ProfileManagementPanel'

interface AdminHeaderProps {
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
  onSidebarToggle?: () => void
}

/**
 * Generate breadcrumb items from current pathname
 */
function useBreadcrumbs() {
  const pathname = usePathname()
  
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    
    return { href, label, isLast: index === segments.length - 1 }
  })
  
  return breadcrumbs
}

export default function AdminHeader({ onMenuToggle, isMobileMenuOpen, onSidebarToggle }: AdminHeaderProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const { unreadCount } = useClientNotifications()
  const breadcrumbs = useBreadcrumbs()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: Implement global search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section - Mobile menu + Desktop sidebar toggle + Breadcrumbs */}
          <div className="flex items-center flex-1">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-2"
              onClick={onMenuToggle}
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop sidebar collapse button */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:inline-flex mr-2"
              onClick={onSidebarToggle}
              aria-label="Toggle sidebar"
              title="Collapse/Expand sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link 
                    href="/admin" 
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <Home className="h-4 w-4" />
                  </Link>
                </li>
                {breadcrumbs.map((breadcrumb, index) => (
                  <li key={breadcrumb.href} className="flex items-center">
                    <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg] mx-1" />
                    {breadcrumb.isLast ? (
                      <span className="text-gray-900 font-medium">
                        {breadcrumb.label}
                      </span>
                    ) : (
                      <Link
                        href={breadcrumb.href}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {breadcrumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Center section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search admin panel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </form>
          </div>

          {/* Right section - Notifications + User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              aria-label={`Notifications ${unreadCount ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Quick navigation icons (moved from footer) */}
            <div className="hidden sm:flex items-center">
              <QuickLinks compact />
            </div>

            {/* User menu */}
            <UserProfileDropdown onSignOut={handleSignOut} onOpenProfilePanel={() => setProfileOpen(true)} />
          </div>
        </div>
      </div>
      <ProfileManagementPanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} defaultTab="profile" />
    </header>
  )
}
