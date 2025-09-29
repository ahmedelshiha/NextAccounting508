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
  User, 
  Settings, 
  LogOut, 
  HelpCircle,
  ChevronDown,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useClientNotifications } from '@/hooks/useClientNotifications'
import Link from 'next/link'
import TenantSwitcher from '@/components/admin/layout/TenantSwitcher'

interface AdminHeaderProps {
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
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

export default function AdminHeader({ onMenuToggle, isMobileMenuOpen }: AdminHeaderProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
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
          {/* Left section - Mobile menu + Breadcrumbs */}
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

          {/* Right section - Tenant + Notifications + User menu */}
          <div className="flex items-center space-x-4">
            <TenantSwitcher />
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

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Help"
              asChild
            >
              <Link href="/admin/help">
                <HelpCircle className="h-5 w-5" />
              </Link>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {session?.user?.name || 'Admin'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(session?.user as any)?.role || 'ADMIN'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
