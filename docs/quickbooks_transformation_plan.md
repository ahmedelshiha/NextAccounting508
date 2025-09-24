# QuickBooks-Style Admin Dashboard Transformation Plan

## Executive Summary

This comprehensive plan addresses the root causes of your current "layered" implementation and provides a complete roadmap to transform your existing admin dashboard into a professional QuickBooks-style interface. The transformation focuses on architectural fixes, component standardization, and enhanced user experience while maintaining your existing backend infrastructure.

### Current Issues Identified
- New sidebar overlaps instead of replacing old layout
- Components render as overlays rather than integrated interface
- Navigation doesn't properly route to workspace containers
- Inconsistent component patterns across modules

### Transformation Goals
- **Adopt QuickBooks-style layout globally**: Fixed sidebar + topbar, right-side workspace
- **Unify navigation (IA)**: Clients, Bookings, Accounting, Team, System
- **Link all components properly**: Sidebar → route → content loads in workspace
- **Refactor legacy shells**: Remove/replace with new layout
- **Improve UX**: Consistent tabs, filters, batch actions, skeletons, accessibility
- **Strengthen maintainability**: Modular components, clear file structure, reusable hooks

---

# Phase 1: Foundation & Layout Architecture

## 1.1 Global Layout Restructure

**Problem**: Your new `DashboardLayout` isn't being used as the global admin layout, causing overlay issues.

**Solution**: Create proper layout hierarchy that replaces existing structure.

### Create Global Admin Layout

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
```

### Create Admin Context Provider

```tsx
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
```

### Enhanced Admin Context

```tsx
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
```

---

# Phase 2: Enhanced Navigation System

## 2.1 Permission-Based Sidebar

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

---

# Phase 3: Page Template System

## 3.1 Standardized Page Templates

Create reusable templates that provide consistent structure across all admin pages.

### Base Standard Page Template

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
```

### List Page Template

```tsx
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
```

---

# Phase 4: Page Migration Strategy

## 4.1 Migration Execution Order

**Priority Matrix:**
- **P0 (Critical)**: Pages breaking current workflow
- **P1 (High)**: High-traffic pages with most user impact
- **P2 (Medium)**: Secondary functionality pages
- **P3 (Low)**: Administrative/system pages

### Week 1: Foundation & Core Pages

**Day 1-2: Architecture Setup**
- [ ] Create `src/app/admin/layout.tsx` (global admin layout)
- [ ] Update enhanced Sidebar component
- [ ] Create AdminProviders and AdminContext
- [ ] Test basic layout structure

**Day 3-5: Dashboard Overview (P0)**
- [ ] Migrate `src/app/admin/page.tsx` using AnalyticsPage template
- [ ] Integrate existing KPI data with new KPICard components
- [ ] Test real-time updates and data refresh
- [ ] Verify navigation from sidebar works properly

**Day 6-7: Critical Path Testing**
- [ ] Test complete user flow from login to dashboard
- [ ] Verify permission-based navigation works
- [ ] Test responsive design on different screen sizes
- [ ] Fix any critical layout issues

### Week 2: High-Traffic Pages

**Bookings Management (P1)**
- [ ] Migrate `src/app/admin/bookings/page.tsx` using ListPage template
- [ ] Update existing booking table to use AdvancedDataTable
- [ ] Integrate bulk actions for booking management
- [ ] Test booking creation/edit workflows

**Service Requests (P1)**
- [ ] Migrate `src/app/admin/service-requests/page.tsx`
- [ ] Integrate with existing SR components in `src/components/admin/service-requests/`
- [ ] Update filters and search functionality
- [ ] Test assignment and status update workflows

**Services Management (P1)**
- [ ] Migrate `src/app/admin/services/page.tsx`
- [ ] Integrate existing services analytics components
- [ ] Update service creation and editing forms
- [ ] Test service configuration workflows

### Week 3: Secondary Pages

**Tasks Management (P2)**
- [ ] Migrate `src/app/admin/tasks/page.tsx`
- [ ] Leverage existing rich tasks components in `src/app/admin/tasks/components/`
- [ ] Integrate with TaskProvider and existing hooks
- [ ] Test task workflows and bulk operations

**Client Management (P2)**
- [ ] Migrate `src/app/admin/clients/profiles/page.tsx`
- [ ] Update client invitation workflows
- [ ] Integrate with existing client data structures
- [ ] Test client creation and management

**Analytics & Reports (P2)**
- [ ] Migrate `src/app/admin/analytics/page.tsx`
- [ ] Create unified analytics dashboard
- [ ] Integrate existing chart components
- [ ] Test export functionality

### Week 4: System & Administrative Pages

**Settings & Configuration (P3)**
- [ ] Migrate `src/app/admin/settings/page.tsx`
- [ ] Update booking settings using existing `BookingSettingsPanel`
- [ ] Integrate currency management
- [ ] Test system configuration workflows

**Team & Permissions (P3)**
- [ ] Migrate team management pages
- [ ] Update permissions and roles interfaces
- [ ] Test user management workflows
- [ ] Verify RBAC functionality

**System Monitoring (P3)**
- [ ] Migrate audit and monitoring pages
- [ ] Update system health dashboards
- [ ] Test logging and monitoring features
- [ ] Verify quarantine upload management

## 4.2 Individual Page Migration Template

For each page migration, follow this standardized checklist:

### Pre-Migration Assessment
- [ ] Document current page functionality
- [ ] Identify data dependencies and API endpoints
- [ ] List user interactions and workflows
- [ ] Note permission requirements
- [ ] Identify reusable existing components

### Migration Execution
- [ ] Remove old layout wrappers and dependencies
- [ ] Choose appropriate template (StandardPage/ListPage/AnalyticsPage)
- [ ] Integrate existing components and data hooks
- [ ] Update routing and navigation links
- [ ] Implement proper loading and error states
- [ ] Add responsive design considerations
- [ ] Test all user interactions

### Post-Migration Validation
- [ ] Verify data loading works correctly
- [ ] Test all interactive elements
- [ ] Validate permission-based access
- [ ] Check responsive design
- [ ] Test error scenarios
- [ ] Verify accessibility standards
- [ ] Update documentation

---

# Phase 5: Advanced Component Integration

## 5.1 Enhanced Data Table with Advanced Features

Create a powerful, reusable data table component that handles your complex admin needs:

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

## 5.2 Bulk Actions Panel

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

---

# Phase 6: Real-time System & Advanced Features

## 6.1 Real-time Updates Provider

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

    return () => {
      source.close()
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

## 6.2 Unified Data Hook

```tsx
// src/hooks/useUnifiedData.ts (NEW - Replaces multiple data hooks)
'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'

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

---

# Phase 7: Complete Page Migration Examples

## 7.1 Dashboard Overview Migration

```tsx
// src/app/admin/page.tsx (MIGRATED - Dashboard Overview)
'use client'

import { useState } from 'react'
import { Plus, Download, RefreshCw } from 'lucide-react'
import AnalyticsPage from '@/components/dashboard/templates/AnalyticsPage'
import ActivityCard from '@/components/dashboard/cards/ActivityCard'
import RevenueChart from '@/components/dashboard/charts/RevenueChart'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { useRealtime } from '@/components/dashboard/realtime/RealtimeProvider'

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    dateRange: 'month',
    status: 'all',
    priority: 'all'
  })
  
  const { data, loading, error, refresh } = useUnifiedData({
    module: 'dashboard',
    filters,
    realtime: true
  })
  
  const { connected, lastEvent } = useRealtime()

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
      value: `${data.stats.revenue.current.toLocaleString()}`,
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
      subtitle={`Last updated: ${lastEvent?.timestamp || 'Loading...'} • ${connected ? 'Connected' : 'Disconnected'}`}
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
```

## 7.2 Bookings Management Migration

```tsx
// src/app/admin/bookings/page.tsx (MIGRATED)
'use client'

import { useState } from 'react'
import { Plus, Download, Calendar } from 'lucide-react'
import ListPage from '@/components/dashboard/templates/ListPage'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { useFilters } from '@/hooks/useFilters'
import StatusBadge from '@/components/dashboard/common/StatusBadge'

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all')
  
  const { filters, updateFilter } = useFilters({
    dateRange: 'month',
    status: 'all',
    priority: 'all'
  })

  const { data, loading, error } = useUnifiedData({
    module: 'bookings',
    filters: { ...filters, tab: activeTab }
  })

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
      render: (value: number) => `${value.toLocaleString()}`
    }
  ]

  const tabs = [
    { key: 'all', label: 'All Bookings', count: data?.stats?.total },
    { key: 'pending', label: 'Pending', count: data?.stats?.pending },
    { key: 'confirmed', label: 'Confirmed', count: data?.stats?.confirmed },
    { key: 'completed', label: 'Completed', count: data?.stats?.completed }
  ]

  const bulkActions = [
    { key: 'confirm', label: 'Confirm Selected', icon: CheckCircle },
    { key: 'cancel', label: 'Cancel Selected', variant: 'destructive' as const }
  ]

  return (
    <ListPage
      title="Bookings Management"
      subtitle="Manage client appointments and scheduling"
      primaryAction={{
        label: 'New Booking',
        icon: <Plus className="w-4 h-4" />,
        onClick: () => window.location.href = '/admin/bookings/new'
      }}
      secondaryActions={[
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
      data={data?.bookings || []}
      loading={loading}
      error={error}
      selectable={true}
      exportable={true}
      bulkActions={bulkActions}
      onBulkAction={(action, selectedRows) => {
        console.log('Bulk action:', action, selectedRows)
      }}
      emptyState={{
        title: 'No bookings found',
        description: 'Create your first booking to get started',
        action: {
          label: 'New Booking',
          onClick: () => window.location.href = '/admin/bookings/new'
        }
      }}
    />
  )
}
```

---

# Phase 8: Testing & Quality Assurance

## 8.1 Testing Strategy

### Unit Tests
```typescript
// Example test structure
describe('AdminDashboard Components', () => {
  describe('Sidebar', () => {
    it('renders navigation items based on permissions', () => {})
    it('handles navigation correctly', () => {})
    it('supports collapse/expand functionality', () => {})
  })
  
  describe('AdvancedDataTable', () => {
    it('renders data correctly', () => {})
    it('handles sorting and filtering', () => {})
    it('supports bulk actions', () => {})
    it('displays loading and error states', () => {})
  })
  
  describe('useUnifiedData hook', () => {
    it('fetches data with correct parameters', () => {})
    it('handles errors gracefully', () => {})
    it('supports real-time updates', () => {})
  })
})
```

### Integration Tests
```typescript
describe('Admin Dashboard Integration', () => {
  it('completes full user workflow: login → dashboard → booking creation', () => {})
  it('respects permission boundaries', () => {})
  it('handles real-time updates correctly', () => {})
  it('maintains state during navigation', () => {})
})
```

## 8.2 Performance Optimization

### Component Lazy Loading
```tsx
// src/components/dashboard/LazyComponents.tsx
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const LazyAnalytics = lazy(() => import('./analytics/UnifiedAnalytics'))
const LazyAdvancedTable = lazy(() => import('./tables/AdvancedDataTable'))

export const Analytics = (props: any) => (
  <Suspense fallback={<Skeleton className="h-64" />}>
    <LazyAnalytics {...props} />
  </Suspense>
)

export const DataTable = (props: any) => (
  <Suspense fallback={<Skeleton className="h-32" />}>
    <LazyAdvancedTable {...props} />
  </Suspense>
)
```

### Data Caching Strategy
```tsx
// Enhanced SWR configuration
const swrConfig = {
  fetcher: (url: string) => fetch(url).then(res => res.json()),
  revalidateOnFocus: false,
  refreshInterval: 300000, // 5 minutes
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  keepPreviousData: true,
  onError: (error, key) => {
    console.error('SWR Error:', error, key)
    // Send to error tracking service
  }
}
```

---

# Phase 9: Deployment & Monitoring

## 9.1 Pre-Deployment Checklist

### Critical Path Testing
- [ ] Global admin layout renders without conflicts
- [ ] All navigation links work correctly
- [ ] Permission-based access functions properly
- [ ] Data loading and real-time updates work
- [ ] Responsive design works on all breakpoints
- [ ] Accessibility standards met (WCAG 2.1 AA)

### Performance Benchmarks
- [ ] Initial page load < 2 seconds
- [ ] Navigation transitions < 500ms
- [ ] Data table rendering < 1 second for 1000 rows
- [ ] Real-time updates < 100ms latency
- [ ] Bundle size increase < 20% from baseline

### Security Validation
- [ ] All API endpoints properly protected
- [ ] Permission checks function correctly
- [ ] No sensitive data exposed in client
- [ ] CSRF protection maintained
- [ ] XSS prevention measures in place

## 9.2 Deployment Strategy

### Phase Rollout Plan
1. **Internal Testing** (1-2 users): Full feature testing
2. **Beta Rollout** (10% users): Limited production testing
3. **Gradual Rollout** (25%, 50%, 75%): Progressive deployment
4. **Full Deployment** (100%): Complete migration

### Rollback Plan
```typescript
// Feature flag implementation
const useQuickBooksLayout = () => {
  const featureFlags = useFeatureFlags()
  return featureFlags.quickbooks_dashboard_v2 && process.env.NODE_ENV === 'production'
}

// In layout.tsx
export default function AdminLayout({ children }: AdminLayoutProps) {
  const useNewLayout = useQuickBooksLayout()
  
  if (useNewLayout) {
    return <QuickBooksDashboardLayout>{children}</QuickBooksDashboardLayout>
  }
  
  return <LegacyDashboardLayout>{children}</LegacyDashboardLayout>
}
```

---

# Phase 10: Maintenance & Future Enhancements

## 10.1 Post-Launch Monitoring

### Key Metrics to Track
- **Performance**: Page load times, bundle sizes, memory usage
- **User Experience**: Navigation patterns, feature adoption, error rates
- **System Health**: API response times, real-time connection stability
- **Business Impact**: User productivity metrics, support ticket volume

### Monitoring Setup
```typescript
// Analytics integration
import { analytics } from '@/lib/analytics'

export const trackUserAction = (action: string, properties: Record<string, any>) => {
  analytics.track(action, {
    ...properties,
    timestamp: new Date().toISOString(),
    userId: session?.user?.id,
    tenantId: session?.user?.tenantId
  })
}

// Usage in components
const handleBookingCreate = () => {
  trackUserAction('booking_created', {
    source: 'admin_dashboard',
    bookingType: 'manual'
  })
}
```

## 10.2 Future Enhancement Roadmap

### Short Term (1-3 months)
- Advanced filtering with saved filter sets
- Customizable dashboard widgets
- Enhanced mobile responsiveness
- Keyboard shortcut support

### Medium Term (3-6 months)  
- White-label customization options
- Advanced analytics and reporting
- Workflow automation features
- Integration with third-party services

### Long Term (6+ months)
- AI-powered insights and recommendations
- Advanced workflow builder
- Multi-tenant architecture enhancements
- Performance optimization with edge computing

---

# Implementation Timeline & Resource Allocation

## Timeline Overview

| Phase | Duration | Focus Area | Resources Required |
|-------|----------|------------|-------------------|
| **Phase 1** | Week 1 | Foundation & Layout | 1 Senior Dev, 1 UI/UX |
| **Phase 2** | Week 1 | Navigation System | 1 Senior Dev |
| **Phase 3** | Week 2 | Page Templates | 1 Mid-level Dev |
| **Phase 4** | Weeks 2-4 | Page Migration | 2 Developers |
| **Phase 5** | Week 3 | Advanced Components | 1 Senior Dev |
| **Phase 6** | Week 4 | Real-time & Features | 1 Senior Dev |
| **Phase 7** | Weeks 2-4 | Complete Migration | All Team |
| **Phase 8** | Week 5 | Testing & QA | 1 QA Engineer |
| **Phase 9** | Week 6 | Deployment | DevOps + Team |
| **Phase 10** | Ongoing | Maintenance | 1 Developer |

## Critical Success Factors

### Technical Prerequisites
- [ ] Next.js 13+ with App Router
- [ ] TypeScript configuration
- [ ] Tailwind CSS setup
- [ ] SWR for data fetching
- [ ] NextAuth for authentication
- [ ] Existing RBAC system functional

### Team Requirements
- [ ] Senior React/Next.js developer (lead)
- [ ] Mid-level frontend developer (support)
- [ ] UI/UX designer (part-time)
- [ ] QA engineer (testing phase)
- [ ] DevOps engineer (deployment)

### Infrastructure Requirements
- [ ] Development environment setup
- [ ] Staging environment for testing
- [ ] Feature flag system
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring
- [ ] Real-time infrastructure (SSE/WebSocket)

---

# Risk Management & Mitigation

## High-Risk Areas

### 1. Layout Conflicts
**Risk**: New layout interferes with existing components
**Mitigation**: 
- Incremental rollout with feature flags
- Thorough testing of each page migration
- Maintain legacy layout as fallback

### 2. Performance Degradation
**Risk**: New components increase bundle size/load times
**Mitigation**:
- Implement lazy loading for heavy components
- Monitor performance metrics continuously
- Optimize bundle splitting and caching

### 3. User Workflow Disruption
**Risk**: Users unable to complete critical tasks
**Mitigation**:
- Beta testing with power users
- Comprehensive user acceptance testing
- Quick rollback capability

### 4. Permission System Conflicts
**Risk**: New navigation breaks existing RBAC
**Mitigation**:
- Thorough testing of all permission combinations
- Gradual rollout by user groups
- Maintain audit logs of access attempts

## Low-Risk Areas

### 1. Data API Integration
- Existing APIs remain unchanged
- New hooks are additive, not replacements
- Data structures remain consistent

### 2. Core Business Logic
- No changes to booking/service logic
- Existing workflows preserved
- Backend systems unaffected

---

# Quality Gates & Acceptance Criteria

## Phase Completion Criteria

### Phase 1: Foundation Complete
- [ ] Global admin layout renders without errors
- [ ] Navigation sidebar displays correctly
- [ ] Authentication integration works
- [ ] Permission-based menu filtering functions
- [ ] Responsive design verified on mobile/tablet/desktop

### Phase 4: Migration Complete  
- [ ] All identified pages migrated to new system
- [ ] No broken navigation links
- [ ] All existing functionality preserved
- [ ] Real-time updates working
- [ ] Bulk operations functional

### Phase 8: Testing Complete
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Cross-browser compatibility verified

### Phase 9: Deployment Complete
- [ ] Production deployment successful
- [ ] No critical bugs reported
- [ ] User acceptance testing passed
- [ ] Monitoring and alerts functional
- [ ] Rollback plan validated

---

# Communication & Change Management

## Stakeholder Communication Plan

### Weekly Status Updates
**Audience**: Project stakeholders, management
**Content**: Progress against timeline, risks, blockers
**Format**: Email summary + brief presentation

### Daily Standups
**Audience**: Development team
**Content**: Yesterday's progress, today's plan, blockers
**Format**: 15-minute meeting

### User Communication
**Timeline**: 
- 2 weeks before: Announce upcoming changes
- 1 week before: Provide preview/training materials
- Launch day: Support available, feedback channels open
- 1 week after: Gather feedback, address issues

## Training Materials

### Quick Start Guide
```markdown
# New Admin Dashboard - Quick Start

## Key Changes
- New sidebar navigation with collapsible groups
- Enhanced search and filtering capabilities
- Bulk actions for managing multiple items
- Real-time updates and notifications

## Navigation
- Use sidebar groups to find features
- Collapsed sidebar shows tooltips on hover
- Badge indicators show pending items
- Quick actions available in top toolbar

## Common Tasks
- Creating bookings: Sidebar → Bookings → New Booking
- Managing service requests: Sidebar → Bookings → Service Requests  
- Viewing analytics: Sidebar → Dashboard → Analytics
- Bulk operations: Select items → Use bulk action bar
```

---

# Appendix: Technical Reference

## A.1 File Structure After Migration

```
src/
├── app/admin/
│   ├── layout.tsx (NEW - Global admin layout)
│   ├── page.tsx (MIGRATED - Dashboard overview)
│   ├── bookings/
│   │   ├── page.tsx (MIGRATED)
│   │   ├── [id]/page.tsx (MIGRATED)
│   │   └── new/page.tsx (MIGRATED)
│   ├── service-requests/
│   │   ├── page.tsx (MIGRATED)
│   │   └── [id]/page.tsx (MIGRATED)
│   └── [other pages...] (MIGRATED)
│
├── components/
│   ├── dashboard/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx (ENHANCED)
│   │   │   ├── Sidebar.tsx (ENHANCED)
│   │   │   ├── TopBar.tsx (EXISTING)
│   │   │   └── PageHeader.tsx (EXISTING)
│   │   ├── templates/
│   │   │   ├── StandardPage.tsx (NEW)
│   │   │   ├── ListPage.tsx (NEW)
│   │   │   └── AnalyticsPage.tsx (NEW)
│   │   ├── tables/
│   │   │   ├── AdvancedDataTable.tsx (NEW)
│   │   │   ├── BulkActionsPanel.tsx (NEW)
│   │   │   └── DataTable.tsx (ENHANCED)
│   │   ├── realtime/
│   │   │   └── RealtimeProvider.tsx (NEW)
│   │   └── [existing components...] (PRESERVED)
│   │
│   └── admin/ (PRESERVED - existing components)
│       ├── service-requests/
│       ├── services/
│       └── [other modules...]
│
├── hooks/
│   ├── useUnifiedData.ts (NEW)
│   ├── useFilters.ts (ENHANCED)
│   └── [existing hooks...] (PRESERVED)
│
└── lib/
    ├── permissions.ts (PRESERVED)
    ├── tenant.ts (PRESERVED)
    └── [existing utilities...] (PRESERVED)
```

## A.2 Environment Variables

```bash
# Required for new features
FEATURE_QUICKBOOKS_DASHBOARD=true
REALTIME_ENABLED=true
ANALYTICS_TRACKING_ID=your_tracking_id

# Existing (preserved)
DATABASE_URL=your_database_url
NEXTAUTH_URL=your_domain
NEXTAUTH_SECRET=your_secret
MULTI_TENANCY_ENABLED=true
```

## A.3 Package Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dropdown-menu": "^2.0.6", 
    "@radix-ui/react-select": "^1.2.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "recharts": "^2.8.0",
    "swr": "^2.2.4"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.4",
    "jest": "^29.7.0"
  }
}
```

---

# Conclusion

This comprehensive transformation plan provides a complete roadmap to migrate your admin dashboard from its current "layered" state to a professional QuickBooks-style interface. The plan addresses:

## Key Benefits

1. **Architectural Foundation**: Global layout system eliminates overlay issues
2. **Unified User Experience**: Consistent navigation and interaction patterns
3. **Enhanced Productivity**: Advanced filtering, bulk operations, real-time updates
4. **Maintainable Codebase**: Modular components, reusable templates, clear separation of concerns
5. **Future-Proof Design**: Extensible architecture supporting future enhancements

## Success Metrics

- **User Productivity**: 25% reduction in time to complete common tasks
- **System Performance**: Page load times under 2 seconds
- **Code Quality**: 90%+ test coverage, consistent component patterns
- **User Satisfaction**: Positive feedback on new interface design
- **Maintenance Efficiency**: 50% reduction in UI-related bug reports

## Critical Path to Success

1. **Week 1**: Establish foundation with global layout
2. **Week 2-4**: Systematic page migration using templates
3. **Week 5**: Comprehensive testing and quality assurance
4. **Week 6**: Gradual deployment with monitoring

The transformation leverages your existing backend infrastructure and data structures, focusing solely on the presentation layer. This approach minimizes risk while delivering maximum impact on user experience and system maintainability.

Your current audit shows a solid foundation with well-structured APIs, comprehensive permission systems, and rich component libraries. This transformation builds upon those strengths to create a modern, professional administrative interface that will serve your users and business needs for years to come.