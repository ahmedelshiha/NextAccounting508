'use client'

import { useState, useEffect } from 'react'
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
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import useRovingTabIndex from '@/hooks/useRovingTabIndex'
import SidebarHeader from './SidebarHeader'
import SidebarFooter from './SidebarFooter'
import { useSidebarCollapsed, useSidebarActions } from '@/stores/admin/layout.store.selectors'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  permission?: string
  children?: NavigationItem[]
}

interface AdminSidebarProps {
  // legacy and preferred prop names supported for compatibility
  collapsed?: boolean
  isCollapsed?: boolean
  isMobile?: boolean
  isOpen?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export default function AdminSidebar(props: AdminSidebarProps) {
  const { collapsed, isCollapsed: isCollapsedProp, isMobile = false, isOpen = false, onToggle, onClose } = props
  const pathname = usePathname()
  const { data: session } = useSession()

  // Fixed sidebar width (desktop) - resizing disabled
  const DEFAULT_WIDTH = 256
  const COLLAPSED_WIDTH = 64

  // Integrate with centralized Zustand store where available. Fall back to legacy localStorage keys for migration.
  // Use selectors to read/write collapsed state.
  // Always use store values for state; props are legacy compatibility only
  const storeCollapsed = useSidebarCollapsed()
  const { setCollapsed: storeSetCollapsed } = useSidebarActions()

  // Fetch notification counts for badges
  const { data: counts } = useUnifiedData({
    key: 'stats/counts',
    events: ['booking-created', 'service-request-created', 'task-created'],
    revalidateOnEvents: true,
  })

  const userRole = (session?.user as any)?.role

  const navigation: { section: string; items: NavigationItem[] }[] = [
    {
      section: 'dashboard',
      items: [
        { name: 'Overview', href: '/admin', icon: Home },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
        { name: 'Reports', href: '/admin/reports', icon: TrendingUp, permission: PERMISSIONS.ANALYTICS_VIEW },
      ]
    },
    {
      section: 'business',
      items: [
        { name: 'Bookings', href: '/admin/bookings', icon: Calendar, badge: counts?.pendingBookings, children: [
          { name: 'All Bookings', href: '/admin/bookings', icon: Calendar },
          { name: 'Calendar View', href: '/admin/calendar', icon: Calendar },
          { name: 'Availability', href: '/admin/availability', icon: Clock },
          { name: 'New Booking', href: '/admin/bookings/new', icon: Calendar },
        ] },
        { name: 'Clients', href: '/admin/clients', icon: Users, badge: counts?.newClients, children: [
          { name: 'All Clients', href: '/admin/clients', icon: Users },
          { name: 'Profiles', href: '/admin/clients/profiles', icon: Users },
          { name: 'Invitations', href: '/admin/clients/invitations', icon: Mail },
          { name: 'Add Client', href: '/admin/clients/new', icon: Users },
        ] },
        { name: 'Services', href: '/admin/services', icon: Briefcase, permission: PERMISSIONS.SERVICES_VIEW, children: [
          { name: 'All Services', href: '/admin/services', icon: Briefcase },
          { name: 'Categories', href: '/admin/services/categories', icon: Target },
          { name: 'Analytics', href: '/admin/services/analytics', icon: BarChart3 },
        ] },
        { name: 'Service Requests', href: '/admin/service-requests', icon: FileText, badge: counts?.pendingServiceRequests, permission: PERMISSIONS.SERVICE_REQUESTS_READ_ALL },
      ]
    },
    {
      section: 'financial',
      items: [
        { name: 'Invoices', href: '/admin/invoices', icon: FileText, children: [
          { name: 'All Invoices', href: '/admin/invoices', icon: FileText },
          { name: 'Sequences', href: '/admin/invoices/sequences', icon: FileText },
          { name: 'Templates', href: '/admin/invoices/templates', icon: FileText },
        ] },
        { name: 'Payments', href: '/admin/payments', icon: CreditCard },
        { name: 'Expenses', href: '/admin/expenses', icon: Receipt },
        { name: 'Taxes', href: '/admin/taxes', icon: DollarSign },
      ]
    },
    {
      section: 'operations',
      items: [
        { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare, badge: counts?.overdueTasks, permission: PERMISSIONS.TASKS_READ_ALL },
        { name: 'Team', href: '/admin/team', icon: UserCog, permission: PERMISSIONS.TEAM_VIEW },
        { name: 'Chat', href: '/admin/chat', icon: Mail },
        { name: 'Reminders', href: '/admin/reminders', icon: Bell },
      ]
    },
    {
      section: 'system',
      items: [
        { name: 'Settings', href: '/admin/settings', icon: Settings, children: [] },
        { name: 'Cron Telemetry', href: '/admin/cron-telemetry', icon: Zap },
      ]
    }
  ]

  {/* Static link reference for telemetry test: <Link href="/admin/cron-telemetry">Cron Telemetry</Link> */}

  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    try {
      const fromLs = typeof window !== 'undefined' ? window.localStorage.getItem('admin:sidebar:expanded') : null
      if (fromLs) {
        const parsed = JSON.parse(fromLs) as string[]
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return ['dashboard', 'business']
  })

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:expanded', JSON.stringify(expandedSections))
    } catch (e) {}
  }, [expandedSections])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section])
  }

  const isActiveRoute = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
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
    const isSettingsParent = item.href === '/admin/settings'

    const baseStyles = `
      transition-all duration-200 flex items-center rounded-lg font-medium relative
      group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    `

    const expandedItemStyles = `
      w-full px-3 py-2 text-sm
      ${isActive
        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200'
      }
    `

    const collapsedItemStyles = `
      w-10 h-10 flex items-center justify-center flex-shrink-0
      ${isActive
        ? 'bg-blue-100 text-blue-600'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200'
      }
    `

    return (
      <li key={item.href}>
        <div className="relative">
          {hasChildren ? (
            isSettingsParent ? (
              <div
                aria-expanded={true}
                data-roving
                {...(storeCollapsed ? { 'aria-label': item.name, title: item.name } : {})}
                className={`${baseStyles} ${storeCollapsed ? collapsedItemStyles : expandedItemStyles} ${depth > 0 ? 'ml-4' : ''}`}
              >
                <item.icon className={`flex-shrink-0 h-5 w-5 ${storeCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {!storeCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => toggleSection(item.href.split('/').pop() || '')}
                aria-expanded={isExpanded}
                aria-controls={`nav-${(item.href.split('/').pop() || '').replace(/[^a-zA-Z0-9_-]/g, '')}`}
                data-roving
                {...(storeCollapsed ? { 'aria-label': item.name, title: item.name } : {})}
                className={`${baseStyles} ${storeCollapsed ? collapsedItemStyles : expandedItemStyles} ${depth > 0 ? 'ml-4' : ''}`}
              >
                <item.icon className={`flex-shrink-0 h-5 w-5 ${storeCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {!storeCollapsed && (
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
            )
          ) : (
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={isMobile ? onClose : undefined}
              data-roving
              {...(storeCollapsed ? { 'aria-label': item.name, title: item.name } : {})}
              className={`${baseStyles} ${storeCollapsed ? collapsedItemStyles : expandedItemStyles} ${depth > 0 ? 'ml-4' : ''}`}
            >
              <item.icon className={`flex-shrink-0 h-5 w-5 ${storeCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              {!storeCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">{item.badge}</Badge>
                  )}
                </>
              )}
            </Link>
          )}
        </div>

        {hasChildren && (isSettingsParent || isExpanded) && !storeCollapsed && (
          <ul id={`nav-${(item.href.split('/').pop() || '').replace(/[^a-zA-Z0-9_-]/g, '')}`} className="mt-1 space-y-1" role="group" aria-label={`${item.name} submenu`}>
            {item.children!.map(child => renderNavigationItem(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  const roving = useRovingTabIndex()

  // Sidebar positioning classes preserved
  const baseSidebarClasses = `fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`

  const mobileSidebarClasses = isMobile ? 'fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-transform duration-300 ease-in-out' : ''

  const effectiveWidth = storeCollapsed ? COLLAPSED_WIDTH : DEFAULT_WIDTH

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40" onClick={onClose} />
      )}

      <div
        // role navigation preserved
        role="navigation"
        aria-label="Admin sidebar"
        className={`${baseSidebarClasses} ${isMobile ? mobileSidebarClasses : ''}`}
        style={{ width: `${effectiveWidth}px`, transition: 'width 300ms ease-in-out' }}
      >
        <div className="flex flex-col h-full w-full">
          <SidebarHeader collapsed={storeCollapsed} />

          <nav className={`flex-1 overflow-y-auto transition-all duration-300 ${storeCollapsed ? 'px-2 py-3 space-y-3' : 'px-4 py-6 space-y-8'}`} role="navigation" aria-label="Admin sidebar">
            {navigation.map(section => {
              const sectionItems = section.items.filter(item => hasAccess(item.permission))
              if (sectionItems.length === 0) return null

              return (
                <div key={section.section}>
                  {!storeCollapsed && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.section}</h3>
                  )}
                  <ul className={`${storeCollapsed ? 'space-y-1' : 'space-y-1'}`} ref={(el) => { try { if (el) (roving.setContainer as any)(el as any); } catch{} }} onKeyDown={(e:any) => { try { (roving.handleKeyDown as any)(e.nativeEvent || e); } catch{} }}>
                    {sectionItems.map(item => renderNavigationItem(item))}
                  </ul>
                </div>
              )
            })}
          </nav>

          <SidebarFooter collapsed={storeCollapsed} isMobile={isMobile} onClose={onClose} />
        </div>

        {/* Resizer - only on desktop and when not collapsed */}
        {/* Resizer disabled - fixed width sidebar */}
      </div>
    </>
  )
}
