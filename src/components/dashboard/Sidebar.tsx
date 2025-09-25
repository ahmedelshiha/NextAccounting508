'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, ChevronDown, Menu } from 'lucide-react'
import { navGroups } from './nav.config'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/permissions'
import { useAdminContext } from '@/components/admin/providers/AdminContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const [expanded, setExpanded] = useState<string[]>(['Clients', 'Bookings'])
  const { sidebarCollapsed, setSidebarCollapsed } = useAdminContext()

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))
  const toggle = (k: string) => setExpanded((p) => (p.includes(k) ? p.filter((g) => g !== k) : [...p, k]))

  // Filter groups/items by permission
  const groups = navGroups
    .filter((g) => !g.permission || hasPermission(role, g.permission))
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.permission || hasPermission(role, it.permission))
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className={`flex h-full flex-col ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-600 rounded-lg grid place-items-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
              <p className="text-xs text-gray-500">Accounting & Bookings</p>
            </div>
          )}
          <button
            type="button"
            aria-label="Toggle sidebar"
            aria-pressed={sidebarCollapsed}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto p-2 rounded hover:bg-gray-100"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!sidebarCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <button aria-label="Create new" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="font-medium">New</span>
          </button>
        </div>
      )}

      <nav className={`flex-1 ${sidebarCollapsed ? 'px-2' : 'px-4'} py-4 overflow-y-auto`} role="navigation" aria-label="Admin navigation">
        <div className="space-y-1">
          {groups.map((group) => {
            const isDash = group.label === 'Dashboard'
            const isOpen = isDash || expanded.includes(group.label)
            const groupKey = `group-${group.label.toLowerCase().replace(/\s+/g, '-')}`
            return (
              <div key={group.label}>
                {!isDash && !sidebarCollapsed && (
                  <button onClick={() => toggle(group.label)} aria-expanded={isOpen} aria-controls={groupKey} className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
                    <span>{group.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
                {(isOpen || sidebarCollapsed) && (
                  <div id={groupKey} className={isDash || sidebarCollapsed ? 'space-y-1' : 'ml-3 mt-1 space-y-1'}>
                    {group.items.map((item) => {
                      const active = isActive(item.href, item.exact)
                      const Icon = item.icon
                      const linkClasses = `flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 text-sm rounded-lg transition-colors ${active ? 'bg-green-50 text-green-700 border-l-2 border-green-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
                      return (
                        <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={linkClasses}>
                          <div className="flex items-center">
                            <Icon className="w-4 h-4 mr-0 md:mr-3" />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                          </div>
                          {!sidebarCollapsed && item.badge && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">{item.badge}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          {!sidebarCollapsed && <span>Operational</span>}
        </div>
      </div>
    </div>
  )
}
