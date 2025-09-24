

# QuickBooks-Style Admin Dashboard Transformation Plan
Executive Summary
Your current implementation suffers from architectural issues where the new QuickBooks components are layered on top of existing structures rather than replacing them. This comprehensive plan addresses the root causes and provides a complete migration strategy.
## Phase 1: Foundation & Layout Architecture
### 1.1 Global Layout Restructure
Problem: Your new DashboardLayout isn't being used as the global admin layout, causing overlay issues.
Solution: Create a proper layout hierarchy:
```tsx
// src/app/admin/layout.tsx (NEW - Global Admin Layout)
import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout'
import { AdminProviders } from '@/components/admin/providers/AdminProviders'

export const metadata: Metadata = {
  title: 'Gate 7 Admin Dashboard',
  description: 'Administrative control panel for Gate 7 services',
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions)
  
  // Auth check
  if (!session?.user) {
    redirect('/login')
  }
  
  // Role-based access check
  const isAuthorized = hasPermission(session.user.role, PERMISSIONS.ADMIN_ACCESS)
  if (!isAuthorized) {
    redirect('/portal')
  }

  return (
    <AdminProviders session={session}>
      <DashboardLayout>
        <div className="min-h-screen">
          {children}
        </div>
      </DashboardLayout>
    </AdminProviders>
  )
}

// src/components/admin/providers/AdminProviders.tsx (NEW)
'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { SessionProvider } from 'next-auth/react'
import { AdminContextProvider } from './AdminContext'
import { ToastProvider } from '@/components/ui/toast'

interface AdminProvidersProps {
  children: ReactNode
  session: any
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function AdminProviders({ children, session }: AdminProvidersProps) {
  return (
    <SessionProvider session={session}>
      <SWRConfig value={{
        fetcher,
        revalidateOnFocus: false,
        refreshInterval: 300000, // 5 minutes
        errorRetryCount: 3,
        onError: (error) => {
          console.error('SWR Error:', error)
        }
      }}>
        <AdminContextProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AdminContextProvider>
      </SWRConfig>
    </SessionProvider>
  )
}

// src/components/admin/providers/AdminContext.tsx (NEW)
'use client'

import { createContext, useContext, ReactNode, useState } from 'react'
import { useSession } from 'next-auth/react'

interface AdminContextType {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  currentTenant: string | null
  userPermissions: string[]
  isLoading: boolean
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const value: AdminContextType = {
    sidebarCollapsed,
    setSidebarCollapsed,
    currentTenant: session?.user?.tenantId || null,
    userPermissions: session?.user?.permissions || [],
    isLoading: status === 'loading'
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminContext() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdminContext must be used within AdminContextProvider')
  }
  return context
}




## Phase 3: Component Standardization & Reusability

### 3.1 Enhanced Data Table with Advanced Features

```tsx
// src/components/dashboard/tables/AdvancedDataTable.tsx (NEW)
'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, MoreHorizontal, Filter, Download, RefreshCw } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import StatusBadge from '../common/StatusBadge'
import BulkActionsPanel from './BulkActionsPanel'

interface Column {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  sticky?: boolean
  render?: (value: any, row: any) => React.ReactNode
  filter?: {
    type: 'select' | 'multiselect' | 'date' | 'number'
    options?: Array<{ value: string; label: string }>
  }
}

interface AdvancedDataTableProps {
  columns: Column[]
  data: any[]
  loading?: boolean
  error?: string
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, any>) => void
  onBulkAction?: (action: string, selectedRows: any[]) => void
  bulkActions?: Array<{ key: string; label: string; variant?: 'default' | 'destructive' }>
  selectable?: boolean
  exportable?: boolean
  onExport?: () => void
  onRefresh?: () => void
  pageSize?: number
  totalCount?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  emptyState?: {
    title: string
    description: string
    action?: { label: string; onClick: () => void }
  }
}

export default function AdvancedDataTable({
  columns,
  data,
  loading,
  error,
  onSort,
  onFilter,
  onBulkAction,
  bulkActions = [],
  selectable = false,
  exportable = false,
  onExport,
  onRefresh,
  pageSize = 50,
  totalCount,
  currentPage = 1,
  onPageChange,
  emptyState
}: AdvancedDataTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({})

  const handleSort = (columnKey: string) => {
    const newDirection = sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortBy(columnKey)
    setSortDirection(newDirection)
    onSort?.(columnKey, newDirection)
  }

  const handleSelectRow = (rowId: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId)
    } else {
      newSelection.add(rowId)
    }
    setSelectedRows(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map(row => row.id)))
    }
  }

  const selectedRowData = useMemo(() => {
    return data.filter(row => selectedRows.has(row.id))
  }, [data, selectedRows])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100"></div>
          {[...Array(pageSize)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 border-t border-gray-100"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (!data.length && emptyState) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
        <p className="text-gray-600 mb-6">{emptyState.description}</p>
        {emptyState.action && (
          <Button onClick={emptyState.action.onClick}>
            {emptyState.action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header Actions */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectable && selectedRows.size > 0 && (
              <div className="text-sm text-gray-600">
                {selectedRows.size} of {data.length} selected
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {exportable && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedRows.size > 0 && bulkActions.length > 0 && (
        <BulkActionsPanel
          selectedCount={selectedRows.size}
          actions={bulkActions}
          onAction={(action) => onBulkAction?.(action, selectedRowData)}
          onClear={() => setSelectedRows(new Set())}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 'text-left'
                  } ${column.sticky ? 'sticky left-0 bg-gray-50 z-10' : ''}`}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      <span>{column.label}</span>
                      {sortBy === column.key && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-3 h-3" /> : 
                          <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={row.id || index} className="hover:bg-gray-50 transition-colors">
                {selectable && (
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedRows.has(row.id)}
                      onCheckedChange={() => handleSelectRow(row.id)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      column.align === 'right' ? 'text-right' : 
                      column.align === 'center' ? 'text-center' : 'text-left'
                    } ${column.sticky ? 'sticky left-0 bg-white z-10' : ''}`}
                  >
                    {column.render ? 
                      column.render(row[column.key], row) : 
                      column.key === 'status' ? 
                        <StatusBadge status={row[column.key]} /> :
                        row[column.key]
                    }
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log('View', row)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log('Edit', row)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => console.log('Delete', row)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount && totalCount > pageSize && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange?.(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(totalCount / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                onClick={() => onPageChange?.(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 1.2 Enhanced Sidebar with Permission-Based Navigation

```tsx
// src/components/dashboard/layout/Sidebar.tsx (ENHANCED)
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Users, Calendar, DollarSign, UserCheck, Settings, Plus, ChevronDown,
  Home, FileText, CreditCard, BarChart3, Shield, Bell, Zap, Clock,
  Briefcase, FileSearch, MessageSquare, Upload, TrendingUp, Package,
  UserPlus, MapPin, HelpCircle, LogOut, Menu
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { useAdminContext } from '@/components/admin/providers/AdminContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  permission?: string
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
  permission?: string
  defaultExpanded?: boolean
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { sidebarCollapsed, setSidebarCollapsed } = useAdminContext()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Dashboard', 'Bookings', 'Clients'])

  // Define navigation based on your audit
  const navigationGroups: NavGroup[] = [
    {
      label: 'Dashboard',
      defaultExpanded: true,
      items: [
        { label: 'Overview', href: '/admin', icon: Home, exact: true },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
        { label: 'Reports', href: '/admin/reports', icon: FileSearch, permission: PERMISSIONS.REPORTS_VIEW }
      ]
    },
    {
      label: 'Clients',
      items: [
        { label: 'Client Profiles', href: '/admin/clients/profiles', icon: Users },
        { label: 'Invitations', href: '/admin/clients/invitations', icon: UserCheck, badge: '3' },
        { label: 'New Client', href: '/admin/clients/new', icon: UserPlus }
      ]
    },
    {
      label: 'Bookings',
      items: [
        { label: 'All Bookings', href: '/admin/bookings', icon: Calendar, badge: '12' },
        { label: 'Calendar View', href: '/admin/calendar', icon: Calendar },
        { label: 'Service Requests', href: '/admin/service-requests', icon: FileText, badge: '5' },
        { label: 'Services', href: '/admin/services', icon: Briefcase },
        { label: 'Availability', href: '/admin/availability', icon: Clock }
      ]
    },
    {
      label: 'Accounting',
      permission: PERMISSIONS.ACCOUNTING_ACCESS,
      items: [
        { label: 'Invoices', href: '/admin/invoices', icon: FileText },
        { label: 'Payments', href: '/admin/payments', icon: CreditCard },
        { label: 'Expenses', href: '/admin/expenses', icon: DollarSign },
        { label: 'Revenue Reports', href: '/admin/reports/revenue', icon: TrendingUp }
      ]
    },
    {
      label: 'Operations',
      items: [
        { label: 'Tasks', href: '/admin/tasks', icon: Package },
        { label: 'Reminders', href: '/admin/reminders', icon: Bell },
        { label: 'Audits', href: '/admin/audits', icon: Shield, permission: PERMISSIONS.ADMIN_FULL }
      ]
    },
    {
      label: 'Content',
      permission: PERMISSIONS.CONTENT_MANAGE,
      items: [
        { label: 'Posts', href: '/admin/posts', icon: FileText },
        { label: 'Newsletter', href: '/admin/newsletter', icon: MessageSquare }
      ]
    },
    {
      label: 'System',
      permission: PERMISSIONS.ADMIN_FULL,
      items: [
        { label: 'Team Management', href: '/admin/team', icon: Users },
        { label: 'Permissions', href: '/admin/permissions', icon: Shield },
        { label: 'Roles', href: '/admin/roles', icon: Shield },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
        { label: 'Integrations', href: '/admin/integrations', icon: Zap },
        { label: 'Uploads', href: '/admin/uploads/quarantine', icon: Upload }
      ]
    }
  ]

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    )
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const hasGroupPermission = (group: NavGroup) => {
    if (!group.permission) return true
    return hasPermission(session?.user?.role, group.permission)
  }

  const hasItemPermission = (item: NavItem) => {
    if (!item.permission) return true
    return hasPermission(session?.user?.role, item.permission)
  }

  const filteredGroups = navigationGroups
    .filter(hasGroupPermission)
    .map(group => ({
      ...group,
      items: group.items.filter(hasItemPermission)
    }))
    .filter(group => group.items.length > 0)

  return (
    <div className={`flex flex-col h-full bg-white transition-all duration-300 ${
      sidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">G7</span>
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <h1 className="text-lg font-semibold text-gray-900 truncate">Gate 7 Admin</h1>
              <p className="text-xs text-gray-500 truncate">Accounting & Bookings</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto p-1 hover:bg-gray-100"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {!sidebarCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </Button>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {filteredGroups.map((group) => {
            const isExpanded = group.defaultExpanded || expandedGroups.includes(group.label)
            
            return (
              <div key={group.label}>
                {/* Group Header */}
                {!sidebarCollapsed && group.label !== 'Dashboard' && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span>{group.label}</span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                )}

                {/* Group Items */}
                {(isExpanded || sidebarCollapsed) && (
                  <div className={!sidebarCollapsed && group.label !== 'Dashboard' ? 'ml-3 mt-1 space-y-1' : 'space-y-1'}>
                    {group.items.map((item) => {
                      const IconComponent = item.icon
                      const active = isActive(item.href, item.exact)

                      const linkContent = (
                        <Link
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                            active
                              ? 'bg-green-50 text-green-700 border-l-2 border-green-600'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          } ${sidebarCollapsed ? 'justify-center' : ''}`}
                        >
                          <div className="flex items-center">
                            <IconComponent className="w-4 h-4 flex-shrink-0" />
                            {!sidebarCollapsed && (
                              <span className="ml-3 truncate">{item.label}</span>
                            )}
                          </div>
                          {!sidebarCollapsed && item.badge && (
                            <Badge variant="destructive" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      )

                      return sidebarCollapsed ? (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                            {item.badge && <p className="text-xs">({item.badge})</p>}
                          </TooltipContent>
                        </Tooltip>
                      ) : linkContent
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full p-2">
                <LogOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Sign Out</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 space-y-1">
              <p>Version 2.1.0</p>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 truncate">
                {session?.user?.name || 'Admin User'}
              </div>
              <Button variant="ghost" size="sm">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```
## Phase 2: Page-by-Page Migration Strategy
### 2.1 Page Template System

```tsx
// src/components/dashboard/templates/StandardPage.tsx (NEW)
import { ReactNode } from 'react'
import PageHeader from '@/components/dashboard/layout/PageHeader'
import PrimaryTabs from '@/components/dashboard/navigation/PrimaryTabs'
import FilterBar from '@/components/dashboard/filters/FilterBar'

interface TabConfig {
  key: string
  label: string
  count?: number | null
}

interface FilterConfig {
  key: string
  label: string
  options: Array<{ value: string; label: string }>
  value: string
}

interface ActionConfig {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface StandardPageProps {
  title: string
  subtitle?: string
  primaryAction?: ActionConfig
  secondaryActions?: ActionConfig[]
  tabs?: TabConfig[]
  activeTab?: string
  onTabChange?: (key: string) => void
  filters?: FilterConfig[]
  onFilterChange?: (key: string, value: string) => void
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  children: ReactNode
  loading?: boolean
  error?: string
}

export default function StandardPage({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  tabs,
  activeTab,
  onTabChange,
  filters,
  onFilterChange,
  searchPlaceholder,
  onSearch,
  children,
  loading,
  error
}: StandardPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />

      {tabs && activeTab && onTabChange && (
        <PrimaryTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={onTabChange}
        />
      )}

      {filters && onFilterChange && (
        <FilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className={loading ? 'opacity-60 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  )
}

// src/components/dashboard/templates/ListPage.tsx (NEW)
import { ReactNode } from 'react'
import StandardPage from './StandardPage'
import DataTable from '@/components/dashboard/tables/DataTable'

interface Column {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => ReactNode
}

interface ListPageProps extends Omit<StandardPageProps, 'children'> {
  columns: Column[]
  data: any[]
  onSort?: (column: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  actions?: Array<{
    label: string
    onClick: (row: any) => void
    variant?: 'default' | 'destructive'
  }>
  emptyState?: {
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
    }
  }
}

export default function ListPage({
  columns,
  data,
  onSort,
  sortBy,
  sortOrder,
  actions,
  emptyState,
  ...pageProps
}: ListPageProps) {
  return (
    <StandardPage {...pageProps}>
      <DataTable
        columns={columns}
        data={data}
        loading={pageProps.loading}
        onSort={onSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        actions={actions}
        emptyState={emptyState}
      />
    </StandardPage>
  )
}

// src/components/dashboard/templates/AnalyticsPage.tsx (NEW)
import { ReactNode } from 'react'
import StandardPage from './StandardPage'
import KPICard from '@/components/dashboard/cards/KPICard'

interface KPIData {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  target?: number
  icon: 'dollar' | 'calendar' | 'users' | 'check'
  color: 'green' | 'blue' | 'purple' | 'orange'
}

interface AnalyticsPageProps extends Omit<StandardPageProps, 'children'> {
  kpis?: KPIData[]
  charts?: ReactNode
  additionalContent?: ReactNode
}

export default function AnalyticsPage({
  kpis = [],
  charts,
  additionalContent,
  ...pageProps
}: AnalyticsPageProps) {
  return (
    <StandardPage {...pageProps}>
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {kpis.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>
      )}
      
      {charts && (
        <div className="mb-6">
          {charts}
        </div>
      )}
      
      {additionalContent}
    </StandardPage>
  )
}
```
### 2.2 Migration Scripts for Each Module

```tsx
// src/app/admin/page.tsx (MIGRATED - Dashboard Overview)
'use client'

import { useState } from 'react'
import { Plus, Download, RefreshCw, TrendingUp } from 'lucide-react'
import AnalyticsPage from '@/components/dashboard/templates/AnalyticsPage'
import ActivityCard from '@/components/dashboard/cards/ActivityCard'
import RevenueChart from '@/components/dashboard/charts/RevenueChart'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    dateRange: 'month',
    status: 'all',
    priority: 'all'
  })
  
  const { data, loading, error, refresh } = useDashboardData(filters)
  const { connected, lastUpdate } = useRealtimeUpdates()

  const handleNewBooking = () => {
    window.location.href = '/admin/bookings/new'
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${new Date().toISOString()}.json`
    a.click()
  }

  const kpis = data ? [
    {
      title: 'Revenue',
      value: `$${data.stats.revenue.current.toLocaleString()}`,
      change: data.stats.revenue.trend,
      target: data.stats.revenue.target,
      icon: 'dollar' as const,
      color: 'green' as const
    },
    {
      title: 'Bookings',
      value: data.stats.bookings.total,
      subtitle: `${data.stats.bookings.pending} pending`,
      change: 15.6,
      icon: 'calendar' as const,
      color: 'blue' as const
    },
    {
      title: 'Active Clients',
      value: data.stats.clients.active,
      subtitle: `${data.stats.clients.new} new`,
      change: 8.2,
      icon: 'users' as const,
      color: 'purple' as const
    },
    {
      title: 'Tasks',
      value: data.stats.tasks.total,
      subtitle: `${data.stats.tasks.overdue} overdue`,
      change: -5.3,
      icon: 'check' as const,
      color: 'orange' as const
    }
  ] : []

  const charts = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <RevenueChart data={data?.revenueAnalytics} />
      </div>
      <div>
        <ActivityCard 
          bookings={data?.recentBookings}
          tasks={data?.urgentTasks}
        />
      </div>
    </div>
  )

  return (
    <AnalyticsPage
      title="Dashboard Overview"
      subtitle={`Last updated: ${lastUpdate?.toLocaleTimeString() || 'Loading...'}`}
      primaryAction={{
        label: 'New Booking',
        icon: <Plus className="w-4 h-4" />,
        onClick: handleNewBooking
      }}
      secondaryActions={[
        {
          label: 'Export',
          icon: <Download className="w-4 h-4" />,
          onClick: handleExport
        },
        {
          label: 'Refresh',
          icon: <RefreshCw className="w-4 h-4" />,
          onClick: refresh
        }
      ]}
      filters={[
        {
          key: 'dateRange',
          label: 'Date Range',
          options: [
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' }
          ],
          value: filters.dateRange
        },
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'completed', label: 'Completed' }
          ],
          value: filters.status
        }
      ]}
      onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      searchPlaceholder="Search bookings, clients, or transactions..."
      kpis={kpis}
      charts={charts}
      loading={loading}
      error={error}
    />
  )
}

// src/app/admin/bookings/page.tsx (MIGRATED)
'use client'

import { useState } from 'react'
import { Plus, Download, Calendar } from 'lucide-react'
import ListPage from '@/components/dashboard/templates/ListPage'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useFilters } from '@/hooks/useFilters'
import StatusBadge from '@/components/dashboard/common/StatusBadge'

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all')
  
  const { filters, updateFilter } = useFilters({
    dateRange: 'month',
    status: 'all',
    priority: 'all'
  })

  const { data, loading, error, refresh } = useDashboardData(filters)

  const handleNewBooking = () => {
    window.location.href = '/admin/bookings/new'
  }

  const handleExport = () => {
    console.log('Exporting bookings...')
  }

  const columns = [
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'service', label: 'Service', sortable: true },
    { 
      key: 'scheduledAt', 
      label: 'Date & Time', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString()
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: false,
      render: (value: string) => <StatusBadge status={value} />
    },
    { 
      key: 'revenue', 
      label: 'Amount', 
      sortable: true, 
      align: 'right' as const,
      render: (value: number) => `$${value.toLocaleString()}`
    }
  ]

  const tabs = [
    { key: 'all', label: 'All Bookings', count: data?.stats.bookings.total },
    { key: 'pending', label: 'Pending', count: data?.stats.bookings.pending },
    { key: 'confirmed', label: 'Confirmed', count: data?.stats.bookings.confirmed },
    { key: 'completed', label: 'Completed', count: data?.stats.bookings.completed }
  ]

  const actions = [
    { label: 'View', onClick: (row: any) => window.location.href = `/admin/bookings/${row.id}` },
    { label: 'Edit', onClick: (row: any) => window.location.href = `/admin/bookings/${row.id}/edit` },
    { label: 'Cancel', onClick: (row: any) => console.log('Cancel', row), variant: 'destructive' as const }
  ]

  return (
    <ListPage
      title="Bookings Management"
      subtitle="Manage client appointments and scheduling"
      primaryAction={{
        label: 'New Booking',
        icon: <Plus className="w-4 h-4" />,
        onClick: handleNewBooking
      }}
      secondaryActions={[
        {
          label: 'Export',
          icon: <Download className="w-4 h-4" />,
          onClick: handleExport
        },
        {
          label: 'Calendar View',
          icon: <Calendar className="w-4 h-4" />,
          onClick: () => window.location.href = '/admin/calendar'
        }
      ]}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      filters={[
        {
          key: 'dateRange',
          label: 'Date Range',
          options: [
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' }
          ],
          value: filters.dateRange
        },
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'completed', label: 'Completed' }
          ],
          value: filters.status
        }
      ]}
      onFilterChange={updateFilter}
      searchPlaceholder="Search bookings, clients..."
      columns={columns}
      data={data?.recentBookings || []}
      onSort={(column) => console.log('Sort by', column)}
      actions={actions}
      loading={loading}
      error={error}
      emptyState={{
        title: 'No bookings found',
        description: 'Create your first booking to get started',
        action: {
          label: 'New Booking',
          onClick: handleNewBooking
        }
      }}
    />
  )
}

// src/app/admin/service-requests/page.tsx (MIGRATED)
'use client'

import { useState } from 'react'
import { Plus, Download, FileText } from 'lucide-react'
import ListPage from '@/components/dashboard/templates/ListPage'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useFilters } from '@/hooks/useFilters'
import StatusBadge from '@/components/dashboard/common/StatusBadge'

export default function ServiceRequestsPage() {
  const [activeTab, setActiveTab] = useState('all')
  
  const { filters, updateFilter } = useFilters({
    dateRange: 'month',
    status: 'all',
    priority: 'all',
    assignee: 'all'
  })

  const { data, loading, error } = useDashboardData(filters)

  const handleNewRequest = () => {
    window.location.href = '/admin/service-requests/new'
  }

  const columns = [
    { key: 'id', label: 'Request ID', sortable: true },
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'serviceType', label: 'Service Type', sortable: true },
    { 
      key: 'priority', 
      label: 'Priority', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'high' ? 'bg-red-100 text-red-700' :
          value === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {value.toUpperCase()}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: false,
      render: (value: string) => <StatusBadge status={value} />
    },
    { 
      key: 'assignedTo', 
      label: 'Assigned To', 
      sortable: true,
      render: (value: string) => value || 'Unassigned'
    },
    { 
      key: 'createdAt', 
      label: 'Created', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ]

  const tabs = [
    { key: 'all', label: 'All Requests', count: data?.serviceRequests?.total },
    { key: 'open', label: 'Open', count: data?.serviceRequests?.open },
    { key: 'in_progress', label: 'In Progress', count: data?.serviceRequests?.inProgress },
    { key: 'completed', label: 'Completed', count: data?.serviceRequests?.completed }
  ]

  const actions = [
    { label: 'View', onClick: (row: any) => window.location.href = `/admin/service-requests/${row.id}` },
    { label: 'Assign', onClick: (row: any) => console.log('Assign', row) },
    { label: 'Update Status', onClick: (row: any) => console.log('Update status', row) }
  ]

  return (
    <ListPage
      title="Service Requests"
      subtitle="Manage client service requests and assignments"
      primaryAction={{
        label: 'New Request',
        icon: <Plus className="w-4 h-4" />,
        onClick: handleNewRequest
      }}
      secondaryActions={[
        {
          label: 'Export',
          icon: <Download className="w-4 h-4" />,
          onClick: () => console.log('Export service requests')
        },
        {
          label: 'Bulk Actions',
          icon: <FileText className="w-4 h-4" />,
          onClick: () => console.log('Bulk actions')
        }
      ]}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      filters={[
        {
          key: 'dateRange',
          label: 'Date Range',
          options: [
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'quarter', label: 'This Quarter' }
          ],
          value: filters.dateRange
        },
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'all', label: 'All Status' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ],
          value: filters.status
        },
        {
          key: 'priority',
          label: 'Priority',
          options: [
            { value: 'all', label: 'All Priorities' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ],
          value: filters.priority
        },
        {
          key: 'assignee',
          label: 'Assignee',
          options: [
            { value: 'all', label: 'All Assignees' },
            { value: 'unassigned', label: 'Unassigned' },
            { value: 'me', label: 'Assigned to Me' }
          ],
          value: filters.assignee
        }
      ]}
      onFilterChange={updateFilter}
      searchPlaceholder="Search requests by ID, client, or service type..."
      columns={columns}
      data={data?.serviceRequests?.items || []}
      actions={actions}
      loading={loading}
      error={error}
      emptyState={{
        title: 'No service requests found',
        description: 'Service requests will appear here when clients submit them',
        action: {
          label: 'Create Request',
          onClick: handleNewRequest
        }
      }}
    />
  )
}
```

#Phase 3: Component Standardization & Reusability
### 3.1 Enhanced Data Table with Advanced Features
```tsx
tsx// src/components/dashboard/tables/AdvancedDataTable.tsx (NEW)
'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, MoreHorizontal, Filter, Download, RefreshCw } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import StatusBadge from '../common/StatusBadge'
import BulkActionsPanel from './BulkActionsPanel'

interface Column {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  sticky?: boolean
  render?: (value: any, row: any) => React.ReactNode
  filter?: {
    type: 'select' | 'multiselect' | 'date' | 'number'
    options?: Array<{ value: string; label: string }>
  }
}

interface AdvancedDataTableProps {
  columns: Column[]
  data: any[]
  loading?: boolean
  error?: string
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, any>) => void
  onBulkAction?: (action: string, selectedRows: any[]) => void
  bulkActions?: Array<{ key: string; label: string; variant?: 'default' | 'destructive' }>
  selectable?: boolean
  exportable?: boolean
  onExport?: () => void
  onRefresh?: () => void
  pageSize?: number
  totalCount?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  emptyState?: {
    title: string
    description: string
    action?: { label: string; onClick: () => void }
  }
}

export default function AdvancedDataTable({
  columns,
  data,
  loading,
  error,
  onSort,
  onFilter,
  onBulkAction,
  bulkActions = [],
  selectable = false,
  exportable = false,
  onExport,
  onRefresh,
  pageSize = 50,
  totalCount,
  currentPage = 1,
  onPageChange,
  emptyState
}: AdvancedDataTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({})

  const handleSort = (columnKey: string) => {
    const newDirection = sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortBy(columnKey)
    setSortDirection(newDirection)
    onSort?.(columnKey, newDirection)
  }

  const handleSelectRow = (rowId: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId)
    } else {
      newSelection.add(rowId)
    }
    setSelectedRows(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map(row => row.id)))
    }
  }

  const selectedRowData = useMemo(() => {
    return data.filter(row => selectedRows.has(row.id))
  }, [data, selectedRows])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100"></div>
          {[...Array(pageSize)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 border-t border-gray-100"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (!data.length && emptyState) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
        <p className="text-gray-600 mb-6">{emptyState.description}</p>
        {emptyState.action && (
          <Button onClick={emptyState.action.onClick}>
            {emptyState.action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header Actions */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectable && selectedRows.size > 0 && (
              <div className="text-sm text-gray-600">
                {selectedRows.size} of {data.length} selected
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {exportable && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedRows.size > 0 && bulkActions.length > 0 && (
        <BulkActionsPanel
          selectedCount={selectedRows.size}
          actions={bulkActions}
          onAction={(action) => onBulkAction?.(action, selectedRowData)}
          onClear={() => setSelectedRows(new Set())}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 'text-left'
                  } ${column.sticky ? 'sticky left-0 bg-gray-50 z-10' : ''}`}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      <span>{column.label}</span>
                      {sortBy === column.key && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-3 h-3" /> : 
                          <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={row.id || index} className="hover:bg-gray-50 transition-colors">
                {selectable && (
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedRows.has(row.id)}
                      onCheckedChange={() => handleSelectRow(row.id)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      column.align === 'right' ? 'text-right' : 
                      column.align === 'center' ? 'text-center' : 'text-left'
                    } ${column.sticky ? 'sticky left-0 bg-white z-10' : ''}`}
                  >
                    {column.render ? 
                      column.render(row[column.key], row) : 
                      column.key === 'status' ? 
                        <StatusBadge status={row[column.key]} /> :
                        row[column.key]
                    }
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log('View', row)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log('Edit', row)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => console.log('Delete', row)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount && totalCount > pageSize && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange?.(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(totalCount / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                onClick={() => onPageChange?.(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

```


### 3.2 Bulk Actions Panel Component

```tsx
// src/components/dashboard/tables/BulkActionsPanel.tsx (NEW)
'use client'

import { X, CheckCircle, Trash2, Archive, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface BulkAction {
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive'
}

interface BulkActionsPanelProps {
  selectedCount: number
  actions: BulkAction[]
  onAction: (actionKey: string) => void
  onClear: () => void
}

export default function BulkActionsPanel({
  selectedCount,
  actions,
  onAction,
  onClear
}: BulkActionsPanelProps) {
  return (
    <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-blue-900">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            {actions.map((action) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.key}
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => onAction(action.key)}
                  className="text-xs"
                >
                  {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
                  {action.label}
                </Button>
              )
            })}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-blue-600 hover:text-blue-800"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  )
}
```

## Phase 4: Migration Execution Strategy

### 4.1 Step-by-Step Migration Order

**Week 1: Foundation**
1. Create `src/app/admin/layout.tsx` (global admin layout)
2. Update `src/components/dashboard/layout/DashboardLayout.tsx`
3. Implement enhanced Sidebar with permissions
4. Test navigation and layout structure

**Week 2: Core Pages**
1. Migrate `/admin` (dashboard overview)
2. Migrate `/admin/bookings`
3. Migrate `/admin/service-requests`
4. Test data flow and real-time updates

**Week 3: Secondary Pages**
1. Migrate `/admin/services`
2. Migrate `/admin/clients`
3. Migrate `/admin/analytics`
4. Migrate `/admin/tasks`

**Week 4: System Pages**
1. Migrate `/admin/settings`
2. Migrate `/admin/permissions`
3. Migrate `/admin/team`
4. Final testing and optimization

### 4.2 Migration Checklist for Each Page

```typescript
// Migration Checklist Template
interface MigrationChecklist {
  pageId: string
  steps: {
    [ ] Remove old layout dependencies
    [ ] Wrap with appropriate template (StandardPage/ListPage/AnalyticsPage)
    [ ] Update navigation links in Sidebar
    [ ] Implement proper permission checks
    [ ] Add loading and error states
    [ ] Test responsive design
    [ ] Verify data fetching works
    [ ] Test all user interactions
    [ ] Add accessibility attributes
    [ ] Update any hardcoded routes
  }
}
```

### 4.3 Data Migration & API Integration

```tsx
// src/hooks/useUnifiedData.ts (NEW - Replaces multiple data hooks)
'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { getTenantFromRequest } from '@/lib/tenant'

interface UnifiedDataOptions {
  module: 'dashboard' | 'bookings' | 'services' | 'clients' | 'tasks'
  filters?: Record<string, any>
  realtime?: boolean
  refreshInterval?: number
}

export function useUnifiedData({ 
  module, 
  filters = {}, 
  realtime = false, 
  refreshInterval = 300000 
}: UnifiedDataOptions) {
  const { data: session } = useSession()
  
  const queryString = new URLSearchParams(filters).toString()
  const endpoint = `/api/admin/${module}${queryString ? `?${queryString}` : ''}`
  
  const { data, error, mutate, isLoading } = useSWR(
    session ? endpoint : null,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${module} data`)
      }
      return response.json()
    },
    {
      refreshInterval: realtime ? 30000 : refreshInterval,
      revalidateOnFocus: false,
      errorRetryCount: 3
    }
  )

  return {
    data,
    loading: isLoading,
    error: error?.message,
    refresh: mutate,
    connected: !error && !isLoading
  }
}
```

## Phase 5: Advanced Features & Optimizations

### 5.1 Real-time Updates System

```tsx
// src/components/dashboard/realtime/RealtimeProvider.tsx (NEW)
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'

interface RealtimeEvent {
  type: 'booking_created' | 'booking_updated' | 'service_request_assigned' | 'task_completed'
  data: any
  timestamp: string
  userId?: string
}

interface RealtimeContextType {
  connected: boolean
  lastEvent: RealtimeEvent | null
  subscribe: (eventTypes: string[]) => void
  unsubscribe: (eventTypes: string[]) => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!session?.user) return

    const source = new EventSource('/api/admin/realtime')
    
    source.onopen = () => {
      setConnected(true)
      console.log('Real-time connection established')
    }

    source.onmessage = (event) => {
      try {
        const eventData: RealtimeEvent = JSON.parse(event.data)
        
        // Only process subscribed events
        if (subscriptions.has(eventData.type)) {
          setLastEvent(eventData)
          
          // Show toast notification for important events
          if (['booking_created', 'service_request_assigned'].includes(eventData.type)) {
            toast({
              title: 'New Activity',
              description: getEventDescription(eventData),
              duration: 5000
            })
          }
        }
      } catch (error) {
        console.error('Error parsing real-time event:', error)
      }
    }

    source.onerror = () => {
      setConnected(false)
      console.error('Real-time connection error')
    }

    setEventSource(source)

    return () => {
      source.close()
      setEventSource(null)
      setConnected(false)
    }
  }, [session, subscriptions])

  const subscribe = (eventTypes: string[]) => {
    setSubscriptions(prev => new Set([...prev, ...eventTypes]))
  }

  const unsubscribe = (eventTypes: string[]) => {
    setSubscriptions(prev => {
      const newSet = new Set(prev)
      eventTypes.forEach(type => newSet.delete(type))
      return newSet
    })
  }

  const getEventDescription = (event: RealtimeEvent): string => {
    switch (event.type) {
      case 'booking_created':
        return `New booking created for ${event.data.clientName}`
      case 'booking_updated':
        return `Booking updated for ${event.data.clientName}`
      case 'service_request_assigned':
        return `Service request #${event.data.id} assigned to ${event.data.assignee}`
      case 'task_completed':
        return `Task "${event.data.title}" marked as completed`
      default:
        return 'New activity occurred'
    }
  }

  return (
    <RealtimeContext.Provider value={{
      connected,
      lastEvent,
      subscribe,
      unsubscribe
    }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return context
}
```

### 5.2 Advanced Filtering & Search

```tsx
// src/components/dashboard/filters/AdvancedFilterPanel.tsx (NEW)
'use client'

import { useState } from 'react'
import { Search, Filter, X, CalendarDays, Users, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface FilterOption {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'date-range' | 'number-range' | 'search'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface AdvancedFilterPanelProps {
  filters: FilterOption[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onSearch: (query: string) => void
  onReset: () => void
  searchQuery?: string
  activeFiltersCount?: number
}

export default function AdvancedFilterPanel({
  filters,
  values,
  onChange,
  onSearch,
  onReset,
  searchQuery = '',
  activeFiltersCount = 0
}: AdvancedFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchValue, setSearchValue] = useState(searchQuery)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchValue)
  }

  const getActiveFilters = () => {
    return filters.filter(filter => {
      const value = values[filter.key]
      return value && value !== 'all' && value !== '' && 
        (Array.isArray(value) ? value.length > 0 : true)
    })
  }

  const activeFilters = getActiveFilters()

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search across all fields..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {(searchValue || activeFilters.length > 0) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchValue('')
                onReset()
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filters.map((filter) => {
              const IconComponent = filter.icon
              return (
                <div key={filter.key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                    {filter.label}
                  </label>
                  
                  {filter.type === 'select' && (
                    <Select
                      value={values[filter.key] || ''}
                      onValueChange={(value) => onChange(filter.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All {filter.label}</SelectItem>
                        {filter.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {filter.type === 'date-range' && (
                    <DatePickerWithRange
                      value={values[filter.key]}
                      onChange={(range) => onChange(filter.key, range)}
                    />
                  )}

                  {filter.type === 'search' && (
                    <Input
                      type="text"
                      placeholder={filter.placeholder}
                      value={values[filter.key] || ''}
                      onChange={(e) => onChange(filter.key, e.target.value)}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onReset} size="sm">
                Reset All
              </Button>
              <Button onClick={() => setIsExpanded(false)} size="sm">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilters.length > 0 && !isExpanded && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {activeFilters.map((filter) => {
              const value = values[filter.key]
              const displayValue = Array.isArray(value) 
                ? `${value.length} selected`
                : filter.options?.find(opt => opt.value === value)?.label || value
              
              return (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {filter.label}: {displayValue}
                  <button
                    onClick={() => onChange(filter.key, '')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 5.3 Enhanced Analytics Dashboard

```tsx
// src/components/dashboard/analytics/UnifiedAnalytics.tsx (NEW)
'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, Users, DollarSign, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    revenueChange: number
    totalBookings: number
    bookingsChange: number
    activeClients: number
    clientsChange: number
    conversionRate: number
    conversionChange: number
  }
  trends: {
    revenue: Array<{ date: string; amount: number; target: number }>
    bookings: Array<{ date: string; count: number; confirmed: number; cancelled: number }>
    clients: Array<{ date: string; new: number; active: number; churned: number }>
  }
  segments: {
    services: Array<{ name: string; revenue: number; bookings: number; color: string }>
    clientTypes: Array<{ name: string; value: number; color: string }>
    timeSlots: Array<{ time: string; bookings: number; revenue: number }>
  }
}

interface UnifiedAnalyticsProps {
  data: AnalyticsData
  loading?: boolean
  dateRange: string
  onDateRangeChange: (range: string) => void
}

export default function UnifiedAnalytics({ 
  data, 
  loading = false, 
  dateRange, 
  onDateRangeChange 
}: UnifiedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.overview.totalRevenue),
      change: data.overview.revenueChange,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Total Bookings',
      value: data.overview.totalBookings.toLocaleString(),
      change: data.overview.bookingsChange,
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'Active Clients',
      value: data.overview.activeClients.toLocaleString(),
      change: data.overview.clientsChange,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Conversion Rate',
      value: `${data.overview.conversionRate}%`,
      change: data.overview.conversionChange,
      icon: Activity,
      color: 'text-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Skeleton for charts */}
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Analytics Overview</h2>
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const IconComponent = kpi.icon
          const isPositive = kpi.change >= 0
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-gray-50 ${kpi.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(kpi.change)}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                  <div className="text-sm text-gray-600">{kpi.title}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#6b7280" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bookings Status */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.trends.bookings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="confirmed" fill="#10b981" name="Confirmed" />
                    <Bar dataKey="count" fill="#3b82f6" name="Total" />
                    <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.segments.services}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {data.segments.services.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Time Slot Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Booking Times</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.segments.timeSlots}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## Phase 6: Final Implementation Steps & Testing

### 6.1 Implementation Priority Matrix

| Priority | Component/Page | Effort | Impact | Dependencies |
|----------|----------------|---------|---------|--------------|
| **P0** | Global Admin Layout | High | High | Auth, RBAC |
| **P0** | Enhanced Sidebar | Medium | High | Permissions |
| **P0** | Dashboard Overview | Medium | High | Data hooks |
| **P1** | Bookings Management | High | High | Service APIs |
| **P1** | Service Requests | High | High | Task APIs |
| **P1** | Data Tables | Medium | Medium | UI components |
| **P2** | Analytics Dashboard | High | Medium | Chart libraries |
| **P2** | Real-time Updates | High | Medium | SSE infrastructure |
| **P3** | Advanced Filtering | Medium | Low | Search APIs |

### 6.2 Testing Strategy

```typescript
// Test Categories & Coverage Requirements

interface TestPlan {
  unit: {
    components: ['Sidebar', 'DataTable', 'KPICard', 'FilterBar']
    hooks: ['useUnifiedData', 'useFilters', 'useRealtime']
    utilities: ['permissions', 'tenant-utils', 'data-formatters']
    coverage: '90%'
  }
  integration: {
    flows: ['login-to-dashboard', 'create-booking', 'filter-and-search']
    apis: ['admin-endpoints', 'realtime-events', 'bulk-operations']
    coverage: '80%'
  }
  e2e: {
    scenarios: ['complete-admin-workflow', 'permission-boundaries', 'responsive-design']
    browsers: ['chrome', 'firefox', 'safari']
    coverage: '70%'
  }
  accessibility: {
    standards: ['WCAG-2.1-AA']
    tools: ['axe-core', 'lighthouse']
    coverage: '100%'
  }
}
```

### 6.3 Performance Optimization

```tsx
// src/components/dashboard/optimization/LazyComponents.tsx (NEW)
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components
const AdvancedAnalytics = lazy(() => import('../analytics/UnifiedAnalytics'))
const RealtimeChart = lazy(() => import('../charts/RealtimeChart'))
const BulkOperationsPanel = lazy(() => import('../bulk/BulkOperationsPanel'))

// Loading skeletons
const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <Skeleton className="h-64" />
  </div>
)

const ChartSkeleton = () => <Skeleton className="h-64" />

// Optimized lazy components with proper error boundaries
export const LazyAnalytics = (props: any) => (
  <Suspense fallback={<AnalyticsSkeleton />}>
    <AdvancedAnalytics {...props} />
  </Suspense>
)

export const LazyChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <RealtimeChart {...props} />
  </Suspense>
)
```

### 6.4 Deployment Checklist

```bash
# Pre-deployment verification
□ All legacy layout references removed
□ Global admin layout implemented
□ Permission system integrated
□ Real-time connections tested
□ Database migrations completed
□ Environment variables configured
□ Error monitoring setup (Sentry)
□ Performance metrics baseline established
□ Accessibility audit passed
□ Cross-browser testing completed
□ Mobile responsiveness verified
□ Load testing completed
□ Security audit passed
□ Documentation updated
□ Rollback plan prepared
```

## Conclusion

This comprehensive transformation plan addresses all the root causes you identified:

1. **Fixed Layout Architecture**: Global admin layout ensures proper QuickBooks-style structure
2. **Unified Navigation**: Permission-based sidebar with proper routing
3. **Modular Components**: Reusable templates and standardized patterns
4. **Enhanced Data Flow**: Unified data hooks and real-time updates
5. **Professional UX**: Advanced filtering, bulk operations, and analytics
6. **Maintainable Codebase**: Clear separation of concerns and comprehensive testing

The phased approach allows for incremental delivery while maintaining system stability. Each phase builds upon the previous one, ensuring a smooth transformation from your current "layered" implementation to a true QuickBooks-style administrative interface.

### Phase 7: Quick Wins & Immediate Actions
Based on your current audit, here are the immediate steps you can take this week to start seeing results:
### 7.1 Day 1-2: Foundation Fix
Create the global admin layout - This single change will fix your "overlay" problem:
tsx// src/app/admin/layout.tsx (CRITICAL - Create this first)
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) redirect('/login')
  if (!['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER'].includes(session.user.role)) {
    redirect('/portal')
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
### 7.2 Day 3-4: Navigation Fix
Update your existing pages to remove old layout dependencies:
tsx// src/app/admin/page.tsx (Quick update - remove any existing layout wrappers)
export default function AdminDashboard() {
  // Remove any existing <DashboardWrapper> or similar components
  // Your existing content goes directly here
  return (
    <div className="space-y-6">
      {/* Your existing dashboard content */}
    </div>
  )
}
### 7.3 Day 5-7: Component Integration
Progressively replace your existing components with the new standardized ones, starting with the most-used pages.
Critical Success Factors

Start with the global layout - This fixes 80% of your current issues
Test each page individually - Ensure navigation works before moving to the next
Keep your existing API endpoints - The new UI layers on top of your current backend
Use feature flags - Deploy incrementally to avoid breaking existing workflows

This transformation plan provides a complete roadmap from your current "layered" state to a professional QuickBooks-style interface. The key is systematic execution - each phase builds upon the previous one, ensuring you maintain functionality while modernizing the user experience.
The most important insight from your audit is that you have solid backend infrastructure already in place. This transformation focuses on the presentation layer and user experience, making it a lower-risk migration that can deliver immediate visual and usability improvements.