/**
 * Admin Sidebar Navigation
 * 
 * Professional sidebar with organized navigation sections:
 * - Dashboard overview
 * - Core business modules (bookings, clients, services)
 * - Financial management (invoices, payments, expenses)
 * - Operations (tasks, reports, analytics)
 * - System management (settings, users, security)
 * 
 * Features:
 * - Active route highlighting
 * - Collapsible sections
 * - Notification badges
 * - Keyboard navigation
 * - Mobile responsive
 */

'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  BarChart3,
  Calendar,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Receipt,
  CheckSquare,
  TrendingUp,
  Settings,
  UserCog,
  Shield,
  Upload,
  Bell,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Home,
  DollarSign,
  Clock,
  Target,
  Building,
  Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  permission?: string
  children?: NavigationItem[]
}

interface AdminSidebarProps {
  isCollapsed?: boolean
  isMobile?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ isCollapsed = false, isMobile = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard', 'business'])
  
  // Fetch notification counts for badges
  const { data: counts } = useUnifiedData({
    key: 'stats/counts',
    events: ['booking-created', 'service-request-created', 'task-created'],
    revalidateOnEvents: true,
  })

  const userRole = (session?.user as any)?.role

  // Main navigation structure
  const navigation: { section: string; items: NavigationItem[] }[] = [
    {
      section: 'dashboard',
      items: [
        {
          name: 'Overview',
          href: '/admin',
          icon: Home,
        },
        {
          name: 'Analytics',
          href: '/admin/analytics',
          icon: BarChart3,
          permission: PERMISSIONS.ANALYTICS_VIEW,
        },
        {
          name: 'Reports',
          href: '/admin/reports',
          icon: TrendingUp,
          permission: PERMISSIONS.ANALYTICS_VIEW,
        },
      ]
    },
    {
      section: 'business',
      items: [
        {
          name: 'Bookings',
          href: '/admin/bookings',
          icon: Calendar,
          badge: counts?.pendingBookings,
          children: [
            { name: 'All Bookings', href: '/admin/bookings', icon: Calendar },
            { name: 'Calendar View', href: '/admin/calendar', icon: Calendar },
            { name: 'Availability', href: '/admin/availability', icon: Clock },
            { name: 'New Booking', href: '/admin/bookings/new', icon: Calendar },
          ]
        },
        {
          name: 'Clients',
          href: '/admin/clients',
          icon: Users,
          badge: counts?.newClients,
          children: [
            { name: 'All Clients', href: '/admin/clients', icon: Users },
            { name: 'Profiles', href: '/admin/clients/profiles', icon: Users },
            { name: 'Invitations', href: '/admin/clients/invitations', icon: Mail },
            { name: 'Add Client', href: '/admin/clients/new', icon: Users },
          ]
        },
        {
          name: 'Services',
          href: '/admin/services',
          icon: Briefcase,
          permission: PERMISSIONS.SERVICES_VIEW,
          children: [
            { name: 'All Services', href: '/admin/services', icon: Briefcase },
            { name: 'Categories', href: '/admin/services/categories', icon: Target },
            { name: 'Analytics', href: '/admin/services/analytics', icon: BarChart3 },
          ]
        },
        {
          name: 'Service Requests',
          href: '/admin/service-requests',
          icon: FileText,
          badge: counts?.pendingServiceRequests,
          permission: PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
        },
      ]
    },
    {
      section: 'financial',
      items: [
        {
          name: 'Invoices',
          href: '/admin/invoices',
          icon: FileText,
          children: [
            { name: 'All Invoices', href: '/admin/invoices', icon: FileText },
            { name: 'Sequences', href: '/admin/invoices/sequences', icon: FileText },
            { name: 'Templates', href: '/admin/invoices/templates', icon: FileText },
          ]
        },
        {
          name: 'Payments',
          href: '/admin/payments',
          icon: CreditCard,
        },
        {
          name: 'Expenses',
          href: '/admin/expenses',
          icon: Receipt,
        },
        {
          name: 'Taxes',
          href: '/admin/taxes',
          icon: DollarSign,
        },
      ]
    },
    {
      section: 'operations',
      items: [
        {
          name: 'Tasks',
          href: '/admin/tasks',
          icon: CheckSquare,
          badge: counts?.overdueTasks,
          permission: PERMISSIONS.TASKS_READ_ALL,
        },
        {
          name: 'Team',
          href: '/admin/team',
          icon: UserCog,
          permission: PERMISSIONS.TEAM_VIEW,
        },
        {
          name: 'Chat',
          href: '/admin/chat',
          icon: Mail,
        },
        {
          name: 'Reminders',
          href: '/admin/reminders',
          icon: Bell,
        },
      ]
    },
    {
      section: 'system',
      items: [
        {
          name: 'Settings',
          href: '/admin/settings',
          icon: Settings,
          children: [
            { name: 'General', href: '/admin/settings', icon: Settings },
            { name: 'Booking Settings', href: '/admin/settings/booking', icon: Calendar },
            { name: 'Currencies', href: '/admin/settings/currencies', icon: DollarSign },
          ]
        },
        {
          name: 'Users & Permissions',
          href: '/admin/users',
          icon: UserCog,
          permission: PERMISSIONS.USERS_VIEW,
          children: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Roles', href: '/admin/roles', icon: Shield },
            { name: 'Permissions', href: '/admin/permissions', icon: Shield },
          ]
        },
        {
          name: 'Security',
          href: '/admin/security',
          icon: Shield,
          children: [
            { name: 'Security Center', href: '/admin/security', icon: Shield },
            { name: 'Audits', href: '/admin/audits', icon: FileText },
            { name: 'Compliance', href: '/admin/compliance', icon: Shield },
          ]
        },
        {
          name: 'Uploads',
          href: '/admin/uploads',
          icon: Upload,
          children: [
            { name: 'Quarantine', href: '/admin/uploads/quarantine', icon: Shield },
          ]
        },
        {
          name: 'Integrations',
          href: '/admin/integrations',
          icon: Zap,
        },
      ]
    }
  ]

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const isActiveRoute = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const hasAccess = (permission?: string) => {
    if (!permission) return true
    return hasPermission(userRole, permission as any)
  }

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    if (!hasAccess(item.permission)) return null

    const isActive = isActiveRoute(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedSections.includes(item.href.split('/').pop() || '')

    return (
      <li key={item.href}>
        <div className="relative">
          {hasChildren ? (
            <button
              onClick={() => toggleSection(item.href.split('/').pop() || '')}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors
                ${isActive 
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }
                ${depth > 0 ? 'ml-4' : ''}
              `}
            >
              <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-2" />
                  )}
                </>
              )}
            </button>
          ) : (
            <Link
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors
                ${isActive 
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }
                ${depth > 0 ? 'ml-4' : ''}
              `}
            >
              <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          )}
        </div>
        
        {hasChildren && isExpanded && !isCollapsed && (
          <ul className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  const sidebarClasses = `
    ${isMobile 
      ? 'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform' 
      : `fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`
    }
  `

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <Building className="h-8 w-8 text-blue-600" />
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  NextAccounting
                </h1>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            {navigation.map(section => {
              const sectionItems = section.items.filter(item => hasAccess(item.permission))
              if (sectionItems.length === 0) return null

              return (
                <div key={section.section}>
                  {!isCollapsed && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {section.section}
                    </h3>
                  )}
                  <ul className="space-y-1">
                    {sectionItems.map(item => renderNavigationItem(item))}
                  </ul>
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/admin/help"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={isMobile ? onClose : undefined}
              >
                <HelpCircle className="h-5 w-5 mr-3 text-gray-400" />
                Help & Support
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}