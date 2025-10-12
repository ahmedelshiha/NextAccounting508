import React, { useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import useRovingTabIndex from '@/hooks/useRovingTabIndex'

export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  permission?: string
  children?: NavItem[]
}

interface SidebarNavProps {
  navigation: { section: string; items: NavItem[] }[]
  collapsed: boolean
  expandedSections: string[]
  onToggleSection: (id: string) => void
  isMobile?: boolean
  onClose?: () => void
  hasAccess: (permission?: string) => boolean
  isActiveRoute: (href: string) => boolean
}

export function SidebarNav({ navigation, collapsed, expandedSections, onToggleSection, isMobile, onClose, hasAccess, isActiveRoute }: SidebarNavProps) {
  const roving = useRovingTabIndex()

  const renderItem = (item: NavItem, depth = 0) => {
    if (!hasAccess(item.permission)) return null

    const isActive = isActiveRoute(item.href)
    const hasChildren = !!(item.children && item.children.length)
    const key = item.href.split('/').pop() || ''
    const isExpanded = expandedSections.includes(key)
    const isSettingsParent = item.href === '/admin/settings'

    const Icon = item.icon

    return (
      <li key={item.href}>
        <div className="relative">
          {hasChildren ? (
            isSettingsParent ? (
              <div
                aria-expanded={true}
                data-roving
                {...(collapsed ? { 'aria-label': item.name, title: item.name } : {})}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors
                  ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}
                  ${depth > 0 ? 'ml-4' : ''}
                `}
              >
                <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {!collapsed && (
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
                onClick={() => onToggleSection(key)}
                aria-expanded={isExpanded}
                aria-controls={`nav-${key.replace(/[^a-zA-Z0-9_-]/g, '')}`}
                data-roving
                {...(collapsed ? { 'aria-label': item.name, title: item.name } : {})}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors
                  ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}
                  ${depth > 0 ? 'ml-4' : ''}
                `}
              >
                <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {!collapsed && (
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
              {...(collapsed ? { 'aria-label': item.name, title: item.name } : {})}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} ${depth > 0 ? 'ml-4' : ''}`}
            >
              <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
              {!collapsed && (
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

        {hasChildren && (isSettingsParent || isExpanded) && !collapsed && (
          <ul id={`nav-${key.replace(/[^a-zA-Z0-9_-]/g, '')}`} className="mt-1 space-y-1" role="group" aria-label={`${item.name} submenu`}>
            {item.children!.map(child => renderItem(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto" role="navigation" aria-label="Admin sidebar">
      {navigation.map(section => {
        const sectionItems = section.items.filter(item => hasAccess(item.permission))
        if (sectionItems.length === 0) return null
        return (
          <div key={section.section}>
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.section}</h3>
            )}
            <ul className="space-y-1" ref={(el) => { try { if (el) (roving.setContainer as any)(el as any); } catch{} }} onKeyDown={(e:any) => { try { (roving.handleKeyDown as any)(e.nativeEvent || e); } catch{} }}>
              {sectionItems.map(item => renderItem(item))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export default SidebarNav
