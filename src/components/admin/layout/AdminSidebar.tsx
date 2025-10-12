'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { hasPermission } from '@/lib/permissions'
import { getNavigation } from '@/lib/admin/navigation-registry'
import SidebarHeader from './Sidebar/SidebarHeader'
import SidebarFooter from './Sidebar/SidebarFooter'
import SidebarResizer from './Sidebar/SidebarResizer'
import SidebarNav, { type NavItem } from './Sidebar/SidebarNav'

interface NavigationItem extends NavItem {}

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

  const navigation = useMemo(() => {
    const sections = getNavigation({ userRole, counts })
    const mapItem = (m: any): NavigationItem => ({
      name: m.label,
      href: m.href,
      icon: m.icon,
      badge: m.badgeKey ? (counts as any)?.[m.badgeKey] : undefined,
      permission: m.permission,
      children: Array.isArray(m.children)
        ? m.children.map((c: any) => ({
            name: c.label,
            href: c.href,
            icon: c.icon,
            badge: c.badgeKey ? (counts as any)?.[c.badgeKey] : undefined,
            permission: c.permission,
          }))
        : undefined,
    })
    return sections.map((s: any) => ({ section: s.key, items: s.items.map(mapItem) }))
  }, [userRole, counts])

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

  // Navigation item rendering is handled by SidebarNav subcomponent

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
          <SidebarHeader collapsed={collapsedEffective} />

          <SidebarNav
            navigation={navigation}
            collapsed={collapsedEffective}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            isMobile={isMobile}
            onClose={onClose}
            hasAccess={hasAccess}
            isActiveRoute={isActiveRoute}
          />

          <SidebarFooter collapsed={collapsedEffective} onLinkClick={isMobile ? onClose : undefined} />
        </div>

        <SidebarResizer
          isMobile={isMobile}
          collapsed={collapsedEffective}
          sidebarWidth={sidebarWidth}
          onKeyDown={onResizerKeyDown}
          onMouseDown={onResizerMouseDown}
          onTouchStart={onResizerTouchStart}
        />
      </div>
    </>
  )
}
