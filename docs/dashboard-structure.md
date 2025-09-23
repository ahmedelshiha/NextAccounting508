# QuickBooks-Style Admin Dashboard – Structure & Components

Below are production-ready React + Tailwind components, organized by file. Copy each block into the indicated path. They are built to be small, reusable, and configurable, and reuse existing project primitives where appropriate.

---

```tsx
// src/types/dashboard.ts
import { ReactNode } from 'react'

export type IconType = React.ComponentType<{ className?: string }>

export interface NavItem {
  label: string
  href: string
  icon: IconType
  badge?: string | number
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface TabItem {
  key: string
  label: string
  count?: number | null
}

export interface FilterOption { value: string; label: string }
export interface FilterConfig { key: string; label: string; options: FilterOption[]; value?: string }

export interface ActionItem { label: string; icon?: ReactNode; onClick: () => void }

export type Align = 'left' | 'center' | 'right'
export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  align?: Align
  render?: (value: any, row: T) => ReactNode
}

export interface RowAction<T> {
  label: string
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
}
```

---

```tsx
// src/components/dashboard/DashboardLayout.tsx
'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sm border-r border-gray-200">
        <Sidebar />
      </aside>
      <div className="ml-64">
        <Topbar />
        <main className="px-6 py-4">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
```

---

```tsx
// src/components/dashboard/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Users, UserCheck, Calendar, Briefcase, Clock, FileText, CreditCard, DollarSign, BarChart3, Shield, Settings, Bell, Zap, Plus, ChevronDown
} from 'lucide-react'
import type { NavGroup } from '@/types/dashboard'

const QB_GREEN = '#2CA01C'

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(['Clients', 'Bookings'])

  const groups: NavGroup[] = [
    { label: 'Dashboard', items: [
      { label: 'Overview', href: '/admin', icon: Home },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ]},
    { label: 'Clients', items: [
      { label: 'Client List', href: '/admin/clients', icon: Users },
      { label: 'Invitations', href: '/admin/clients/invitations', icon: UserCheck, badge: '3' },
      { label: 'Profiles', href: '/admin/clients/profiles', icon: Users },
    ]},
    { label: 'Bookings', items: [
      { label: 'Appointments', href: '/admin/bookings', icon: Calendar, badge: '12' },
      { label: 'Services', href: '/admin/services', icon: Briefcase },
      { label: 'Availability', href: '/admin/availability', icon: Clock },
      { label: 'Booking Settings', href: '/admin/settings/booking', icon: Settings },
      { label: 'Service Requests', href: '/admin/service-requests', icon: FileText, badge: '5' },
    ]},
    { label: 'Accounting', items: [
      { label: 'Invoices', href: '/admin/invoices', icon: FileText },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Expenses', href: '/admin/expenses', icon: DollarSign },
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
      { label: 'Taxes', href: '/admin/taxes', icon: Clock },
    ]},
    { label: 'Team', items: [
      { label: 'Staff', href: '/admin/team', icon: Users },
      { label: 'Roles', href: '/admin/roles', icon: Shield },
      { label: 'Permissions', href: '/admin/permissions', icon: Shield },
    ]},
    { label: 'System', items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Integrations', href: '/admin/integrations', icon: Zap },
    ]},
  ]

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))
  const toggle = (k: string) => setExpanded((p) => (p.includes(k) ? p.filter((g) => g !== k) : [...p, k]))

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: QB_GREEN }}>
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
            <p className="text-xs text-gray-500">Accounting & Bookings</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <button className="w-full text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors hover:opacity-90" style={{ backgroundColor: QB_GREEN }}>
          <Plus className="w-4 h-4" />
          <span className="font-medium">New</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-1">
          {groups.map((group) => {
            const isDash = group.label === 'Dashboard'
            const isOpen = isDash || expanded.includes(group.label)
            return (
              <div key={group.label}>
                {!isDash && (
                  <button onClick={() => toggle(group.label)} className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
                    <span>{group.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
                {isOpen && (
                  <div className={isDash ? 'space-y-1' : 'ml-3 mt-1 space-y-1'}>
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      const Icon = item.icon
                      return (
                        <Link key={item.href} href={item.href} className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${active ? 'bg-green-50 text-green-700 border-l-2 border-green-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                          <div className="flex items-center">
                            <Icon className="w-4 h-4 mr-3" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
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
          <span>Operational</span>
        </div>
      </div>
    </div>
  )
}
```

---

```tsx
// src/components/dashboard/Topbar.tsx
'use client'

import { useState } from 'react'
import { Search, Bell, Settings, User, ChevronDown, HelpCircle } from 'lucide-react'

export function Topbar() {
  const [open, setOpen] = useState<'none' | 'notifications' | 'profile'>('none')
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg">
            <span className="font-medium">Accounting Firm</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Accountant tools</button>
        </div>
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder="Search transactions, clients, bookings..." />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-500 hover:text-gray-700"><HelpCircle className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setOpen((v) => (v === 'notifications' ? 'none' : 'notifications'))} className="relative p-2 text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {open === 'notifications' && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 text-sm text-gray-700">
                <div className="px-4 pb-2 font-medium">Notifications</div>
                <div className="px-4 py-6 text-center text-gray-500">No new notifications</div>
              </div>
            )}
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700"><Settings className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setOpen((v) => (v === 'profile' ? 'none' : 'profile'))} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full grid place-items-center"><User className="w-4 h-4 text-white" /></div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {open === 'profile' && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@example.com</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Profile Settings</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
```

---

```tsx
// src/components/dashboard/PageHeader.tsx
import type { ActionItem } from '@/types/dashboard'

export function PageHeader({ title, subtitle, primaryAction, secondaryActions = [] }: { title: string; subtitle?: string; primaryAction?: ActionItem; secondaryActions?: ActionItem[] }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6 mb-6 -mx-6 -mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {secondaryActions.map((a, i) => (
            <button key={i} onClick={a.onClick} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">{a.icon}{a.label}</button>
          ))}
          {primaryAction && (
            <button onClick={primaryAction.onClick} className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-95 flex items-center gap-2" style={{ backgroundColor: '#2CA01C' }}>{primaryAction.icon}{primaryAction.label}</button>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

```tsx
// src/components/dashboard/PrimaryTabs.tsx
import type { TabItem } from '@/types/dashboard'

export function PrimaryTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => onChange(t.key)} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${active === t.key ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            <span>{t.label}</span>
            {t.count != null && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active === t.key ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
```

---

```tsx
// src/components/dashboard/SecondaryTabs.tsx
import type { TabItem } from '@/types/dashboard'

export function SecondaryTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${active === t.key ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
          {t.label}
          {t.count != null && <span className="ml-2 text-xs opacity-80">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
```

---

```tsx
// src/components/dashboard/FilterBar.tsx
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { FilterConfig } from '@/types/dashboard'

export function FilterBar({ filters, onFilterChange, onSearch, active = [], searchPlaceholder = 'Search...' }: { filters: FilterConfig[]; onFilterChange: (key: string, value: string) => void; onSearch?: (value: string) => void; active?: Array<{ key: string; label: string; value: string }>; searchPlaceholder?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        {onSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input onChange={(e) => onSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder={searchPlaceholder} />
          </div>
        )}
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <select key={f.key} value={f.value ?? ''} onChange={(e) => onFilterChange(f.key, e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">{f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50">
            <SlidersHorizontal className="w-4 h-4" />
            Customize
          </button>
        </div>
      </div>
      {active.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Active filters:</span>
          {active.map((t) => (
            <span key={t.key} className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-sm">
              <span>{t.label}: {t.value}</span>
              <button onClick={() => onFilterChange(t.key, '')} className="hover:bg-green-100 rounded p-0.5"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

```tsx
// src/components/dashboard/DataTable.tsx
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Column, RowAction } from '@/types/dashboard'
import { useMemo, useState } from 'react'

export function DataTable<T extends { id?: string | number }>({ columns, rows, loading, sortBy, sortOrder = 'asc', onSort, actions = [], selectable = false, onSelectionChange }: { columns: Column<T>[]; rows: T[]; loading?: boolean; sortBy?: string; sortOrder?: 'asc' | 'desc'; onSort?: (key: string) => void; actions?: RowAction<T>[]; selectable?: boolean; onSelectionChange?: (ids: Array<string | number>) => void }) {
  const [selected, setSelected] = useState<Set<string | number>>(new Set())
  const allSelected = useMemo(() => rows.length > 0 && selected.size === rows.length, [rows.length, selected])

  const toggleAll = () => {
    const next = allSelected ? new Set<string | number>() : new Set(rows.map((r) => r.id!).filter(Boolean))
    setSelected(next)
    onSelectionChange?.(Array.from(next))
  }

  const toggleOne = (id?: string | number) => {
    if (id == null) return
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
    onSelectionChange?.(Array.from(next))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 rounded-t-lg" />
          {[...Array(5)].map((_, i) => (<div key={i} className="h-16 bg-gray-50 border-t border-gray-100" />))}
        </div>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-600">
        No data available
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
              )}
              {columns.map((c) => (
                <th key={String(c.key)} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}>
                  {c.sortable && onSort ? (
                    <button onClick={() => onSort(String(c.key))} className="flex items-center gap-1 hover:text-gray-700">
                      <span>{c.label}</span>
                      {sortBy === c.key && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx} className="hover:bg-gray-50">
                {selectable && (
                  <td className="px-4 py-4"><input type="checkbox" checked={row.id != null && selected.has(row.id)} onChange={() => toggleOne(row.id)} /></td>
                )}
                {columns.map((c) => (
                  <td key={String(c.key)} className={`px-6 py-4 whitespace-nowrap text-sm ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}>
                    {c.render ? c.render((row as any)[c.key as any], row) : (row as any)[c.key as any]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {actions.map((a, i) => (
                        <button key={i} onClick={() => a.onClick(row)} className={`px-3 py-1 text-xs font-medium rounded-md ${a.variant === 'destructive' ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-100'}`}>{a.label}</button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectable && selected.size > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-700">{selected.size} selected</div>
      )}
    </div>
  )
}
```

---

Notes
- Primary color uses QuickBooks green (#2CA01C) for accents.
- Components are purely Tailwind; they do not rely on third-party UI kits.
- All items are configurable via props (tabs, filters, columns, actions) and reuse existing routing.
