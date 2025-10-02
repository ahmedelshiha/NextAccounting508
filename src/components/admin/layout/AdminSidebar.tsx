'use client'

import { useState, useEffect, useRef } from 'react'
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

  const collapsedEffective = typeof isCollapsedProp === 'boolean' ? isCollapsedProp : (typeof collapsed === 'boolean' ? collapsed : false)

  // Persisted sidebar width (desktop)
  const DEFAULT_WIDTH = 256
  const COLLAPSED_WIDTH = 64
  const MIN_WIDTH = 160
  const MAX_WIDTH = 420

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      if (typeof window === 'undefined') return DEFAULT_WIDTH
      const raw = window.localStorage.getItem('admin:sidebar:width')
      if (raw) {
        const parsed = parseInt(raw, 10)
        if (!Number.isNaN(parsed)) return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed))
      }
    } catch (e) {}
    return DEFAULT_WIDTH
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const resizerRef = useRef<HTMLDivElement | null>(null)

  // Save width
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:width', String(sidebarWidth))
    } catch (e) {}
  }, [sidebarWidth])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + dx))
      setSidebarWidth(newWidth)
    }
    function onMouseUp() {
      if (isDragging) setIsDragging(false)
      dragRef.current = null
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.body.style.cursor = 'col-resize'
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
    }
  }, [isDragging])

  // Touch support
  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!dragRef.current) return
      const touch = e.touches[0]
      const dx = touch.clientX - dragRef.current.startX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + dx))
      setSidebarWidth(newWidth)
    }
    function onTouchEnd() {
      if (isDragging) setIsDragging(false)
      dragRef.current = null
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
    if (isDragging) {
      document.addEventListener('touchmove', onTouchMove)
      document.addEventListener('touchend', onTouchEnd)
    }
    return () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isDragging])

  const startDrag = (clientX: number) => {
    if (collapsedEffective) return
    dragRef.current = { startX: clientX, startWidth: sidebarWidth }
    setIsDragging(true)
  }

  const onResizerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startDrag(e.clientX)
  }
  const onResizerTouchStart = (e: React.TouchEvent) => {
    startDrag(e.touches[0].clientX)
  }

  const onResizerKeyDown = (e: React.KeyboardEvent) => {
    if (collapsedEffective) return
    if (e.key === 'ArrowLeft') {
      setSidebarWidth(w => Math.max(MIN_WIDTH, w - 16))
    } else if (e.key === 'ArrowRight') {
      setSidebarWidth(w => Math.min(MAX_WIDTH, w + 16))
    } else if (e.key === 'Home') {
      setSidebarWidth(MIN_WIDTH)
    } else if (e.key === 'End') {
      setSidebarWidth(MAX_WIDTH)
    }
  }

  // Expand/collapse based on width threshold
  useEffect(() => {
    try {
      if (sidebarWidth <= 80) {
        if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:collapsed', '1')
      } else {
        if (typeof window !== 'undefined') window.localStorage.removeItem('admin:sidebar:collapsed')
      }
    } catch (e) {}
  }, [sidebarWidth])

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
      ]
    }
  ]

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

    return (
      <li key={item.href}>
        <div className="relative">
          {hasChildren ? (
            isSettingsParent ? (
              <div
                aria-expanded={true}
                data-roving
                {...(collapsedEffective ? { 'aria-label': item.name, title: item.name } : {})}
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
                {!collapsedEffective && (
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
                {...(collapsedEffective ? { 'aria-label': item.name, title: item.name } : {})}
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
                {!collapsedEffective && (
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
              {...(collapsedEffective ? { 'aria-label': item.name, title: item.name } : {})}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} ${depth > 0 ? 'ml-4' : ''}`}
            >
              <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
              {!collapsedEffective && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">{item.badge}</Badge>
                  )}
                </>
              )}
            </Link>
          )}
        </div>

        {hasChildren && (isSettingsParent || isExpanded) && !collapsedEffective && (
          <ul id={`nav-${(item.href.split('/').pop() || '').replace(/[^a-zA-Z0-9_-]/g, '')}`} className="mt-1 space-y-1" role="group" aria-label={`${item.name} submenu`}>
            {item.children!.map(child => renderNavigationItem(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  const roving = useRovingTabIndex()

  // Sidebar positioning classes preserved
  const baseSidebarClasses = `fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-150 flex`

  const mobileSidebarClasses = isMobile ? 'fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-transform' : ''

  const effectiveWidth = collapsedEffective ? COLLAPSED_WIDTH : sidebarWidth

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
        style={{ width: `${effectiveWidth}px` }}
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <Building className="h-8 w-8 text-blue-600" />
            {!collapsedEffective && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">NextAccounting</h1>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto" role="navigation" aria-label="Admin sidebar">
            {navigation.map(section => {
              const sectionItems = section.items.filter(item => hasAccess(item.permission))
              if (sectionItems.length === 0) return null

              return (
                <div key={section.section}>
                  {!collapsedEffective && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.section}</h3>
                  )}
                  <ul className="space-y-1" ref={(el) => { try { if (el) (roving.setContainer as any)(el as any); } catch{} }} onKeyDown={(e:any) => { try { (roving.handleKeyDown as any)(e.nativeEvent || e); } catch{} }}>
                    {sectionItems.map(item => renderNavigationItem(item))}
                  </ul>
                </div>
              )
            })}
          </nav>

          {!collapsedEffective && (
            <div className="p-4 border-t border-gray-200">
              <Link href="/admin/help" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100" onClick={isMobile ? onClose : undefined}>
                <HelpCircle className="h-5 w-5 mr-3 text-gray-400" />
                Help & Support
              </Link>
            </div>
          )}
        </div>

        {/* Resizer - only on desktop and when not collapsed */}
        {!isMobile && !collapsedEffective && (
          <div
            ref={resizerRef}
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
            aria-valuenow={Math.round(sidebarWidth)}
            onKeyDown={onResizerKeyDown}
            onMouseDown={onResizerMouseDown}
            onTouchStart={onResizerTouchStart}
            className={`absolute top-0 right-0 h-full w-2 -mr-1 cursor-col-resize z-40`}>
            <div className={`h-full w-0.5 mx-auto bg-transparent hover:bg-gray-200`}></div>
          </div>
        )}
      </div>
    </>
  )
}
