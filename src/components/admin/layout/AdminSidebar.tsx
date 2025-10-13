"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { hasPermission } from '@/lib/permissions'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import useRovingTabIndex from '@/hooks/useRovingTabIndex'
import { getNavigation, type NavItemMeta, type NavSection } from '@/lib/admin/navigation-registry'

interface AdminSidebarProps {
  collapsed?: boolean
  isCollapsed?: boolean
  isMobile?: boolean
  isOpen?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export default function AdminSidebar(props: AdminSidebarProps) {
  const { collapsed, isCollapsed: isCollapsedProp, isMobile = false, isOpen = false, onClose } = props
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
    } catch {}
    return DEFAULT_WIDTH
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:width', String(sidebarWidth))
    } catch {}
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
    if (e.key === 'ArrowLeft') setSidebarWidth(w => Math.max(MIN_WIDTH, w - 16))
    else if (e.key === 'ArrowRight') setSidebarWidth(w => Math.min(MAX_WIDTH, w + 16))
    else if (e.key === 'Home') setSidebarWidth(MIN_WIDTH)
    else if (e.key === 'End') setSidebarWidth(MAX_WIDTH)
  }

  useEffect(() => {
    try {
      if (sidebarWidth <= 80) {
        if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:collapsed', '1')
      } else {
        if (typeof window !== 'undefined') window.localStorage.removeItem('admin:sidebar:collapsed')
      }
    } catch {}
  }, [sidebarWidth])

  // Fetch notification/count badges
  const { data: counts } = useUnifiedData({
    key: 'stats/counts',
    events: ['booking-created', 'service-request-created', 'task-created'],
    revalidateOnEvents: true,
  })

  const userRole = (session?.user as any)?.role

  // Build navigation from centralized registry
  const sections: NavSection[] = useMemo(() => getNavigation({ userRole, counts: counts || null }), [userRole, counts])

  // Expanded state per parent id
  const [expanded, setExpanded] = useState<string[]>(() => {
    try {
      const fromLs = typeof window !== 'undefined' ? window.localStorage.getItem('admin:sidebar:expanded') : null
      if (fromLs) {
        const parsed = JSON.parse(fromLs) as string[]
        if (Array.isArray(parsed)) return parsed
      }
    } catch {}
    return ['dashboard', 'business']
  })

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:expanded', JSON.stringify(expanded))
    } catch {}
  }, [expanded])

  const toggleParent = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const isActiveRoute = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const hasAccess = (permission?: string) => {
    if (!permission) return true
    return hasPermission(userRole, permission as any)
  }

  const renderSettingsChildren = () => {
    const items = (SETTINGS_REGISTRY || [])
      .filter((c: any) => c && c.route && c.route !== '/admin/settings')
      .filter((c: any) => hasAccess(c.permission))
      .map((c: any) => ({
        id: `settings_${c.key}`,
        label: c.label,
        href: c.route,
        icon: c.icon,
      }))
    return items
  }

  const renderItem = (item: NavItemMeta, depth = 0) => {
    if (!hasAccess(item.permission)) return null

    const isActive = isActiveRoute(item.href)
    const isSettingsParent = item.href === '/admin/settings'
    const children = isSettingsParent ? renderSettingsChildren() : (item.children || [])
    const hasChildren = children.length > 0
    const isExpanded = expanded.includes(item.id)

    const badgeVal = (item as any).badgeKey ? (counts as any)?.[(item as any).badgeKey] : undefined

    return (
      <li key={item.id}>
        <div className="relative">
          {hasChildren ? (
            isSettingsParent ? (
              <div
                aria-expanded={true}
                data-roving
                {...(collapsedEffective ? { 'aria-label': item.label, title: item.label } : {})}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors
                  ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}
                  ${depth > 0 ? 'ml-4' : ''}
                `}
              >
                <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {!collapsedEffective && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badgeVal && (
                      <Badge variant="secondary" className="ml-2">{badgeVal as any}</Badge>
                    )}
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => toggleParent(item.id)}
                aria-expanded={isExpanded}
                aria-controls={`nav-${item.id}`}
                data-roving
                {...(collapsedEffective ? { 'aria-label': item.label, title: item.label } : {})}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors
                  ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}
                  ${depth > 0 ? 'ml-4' : ''}
                `}
              >
                <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {!collapsedEffective && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badgeVal && (
                      <Badge variant="secondary" className="ml-2">{badgeVal as any}</Badge>
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
              {...(collapsedEffective ? { 'aria-label': item.label, title: item.label } : {})}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} ${depth > 0 ? 'ml-4' : ''}`}
            >
              <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
              {!collapsedEffective && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {badgeVal && (
                    <Badge variant="secondary" className="ml-2">{badgeVal as any}</Badge>
                  )}
                </>
              )}
            </Link>
          )}
        </div>

        {hasChildren && (!collapsedEffective) && (
          <ul id={`nav-${item.id}`} className="mt-1 space-y-1" role="group" aria-label={`${item.label} submenu`}>
            {children.map((child) => (
              <li key={child.id}>
                {renderItem(child, depth + 1)}
              </li>
            ))}
          </ul>
        )}
      </li>
    )
  }

  const roving = useRovingTabIndex()

  const baseSidebarClasses = `fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-150 flex`
  const mobileSidebarClasses = isMobile ? 'fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-transform' : ''
  const effectiveWidth = collapsedEffective ? COLLAPSED_WIDTH : sidebarWidth

  return (
    <nav aria-label="Admin sidebar" className={`${baseSidebarClasses} ${isMobile ? mobileSidebarClasses : ''}`} style={{ width: effectiveWidth }}>
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">NA</div>
              {!collapsedEffective && <div className="text-sm font-semibold">NextAccounting</div>}
            </div>
            {!collapsedEffective && (
              <div className="flex items-center gap-2">
                <button className="text-xs text-gray-500 hover:text-gray-700">Docs</button>
                <button className="text-xs text-gray-500 hover:text-gray-700">Support</button>
              </div>
            )}
          </div>
        </div>

        <div className="px-2 py-4 space-y-4">
          {sections.map(section => (
            <div key={section.key}>
              {!collapsedEffective && <div className="px-3 text-xs text-gray-500 uppercase tracking-wide mb-2">{section.key}</div>}
              <ul className="space-y-1">
                {section.items.map(item => renderItem(item))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {!isMobile && !collapsedEffective && (
        <div
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
          onKeyDown={onResizerKeyDown}
          onMouseDown={onResizerMouseDown}
          onTouchStart={onResizerTouchStart}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
        />
      )}
    </nav>
  )
}
