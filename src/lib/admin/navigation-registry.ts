import type { ComponentType } from 'react'
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
  Settings as SettingsIcon,
  UserCog,
  Shield,
  Upload,
  Bell,
  Mail,
  HelpCircle,
  Home,
  DollarSign,
  Clock,
  Target,
  Building,
  Zap,
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export type IconType = ComponentType<{ className?: string }>

export interface NavItemMeta {
  id: string
  label: string
  href: string
  icon: IconType
  permission?: string
  badgeKey?: string
  children?: NavItemMeta[]
}

export interface NavSection {
  key: string
  items: NavItemMeta[]
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    key: 'dashboard',
    items: [
      { id: 'overview', label: 'Overview', href: '/admin', icon: Home },
      { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
      { id: 'reports', label: 'Reports', href: '/admin/reports', icon: TrendingUp, permission: PERMISSIONS.ANALYTICS_VIEW },
    ],
  },
  {
    key: 'business',
    items: [
      {
        id: 'bookings',
        label: 'Bookings',
        href: '/admin/bookings',
        icon: Calendar,
        badgeKey: 'pendingBookings',
        children: [
          { id: 'bookings_all', label: 'All Bookings', href: '/admin/bookings', icon: Calendar },
          { id: 'calendar', label: 'Calendar View', href: '/admin/calendar', icon: Calendar },
          { id: 'availability', label: 'Availability', href: '/admin/availability', icon: Clock },
          { id: 'bookings_new', label: 'New Booking', href: '/admin/bookings/new', icon: Calendar },
        ],
      },
      {
        id: 'clients',
        label: 'Clients',
        href: '/admin/clients',
        icon: Users,
        badgeKey: 'newClients',
        children: [
          { id: 'clients_all', label: 'All Clients', href: '/admin/clients', icon: Users },
          { id: 'profiles', label: 'Profiles', href: '/admin/clients/profiles', icon: Users },
          { id: 'invitations', label: 'Invitations', href: '/admin/clients/invitations', icon: Mail },
          { id: 'clients_new', label: 'Add Client', href: '/admin/clients/new', icon: Users },
        ],
      },
      {
        id: 'services',
        label: 'Services',
        href: '/admin/services',
        icon: Briefcase,
        permission: PERMISSIONS.SERVICES_VIEW,
        children: [
          { id: 'services_all', label: 'All Services', href: '/admin/services', icon: Briefcase },
          { id: 'services_categories', label: 'Categories', href: '/admin/services/categories', icon: Target },
          { id: 'services_analytics', label: 'Analytics', href: '/admin/services/analytics', icon: BarChart3 },
        ],
      },
      {
        id: 'service_requests',
        label: 'Service Requests',
        href: '/admin/service-requests',
        icon: FileText,
        permission: PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
        badgeKey: 'pendingServiceRequests',
      },
    ],
  },
  {
    key: 'financial',
    items: [
      {
        id: 'invoices',
        label: 'Invoices',
        href: '/admin/invoices',
        icon: FileText,
        children: [
          { id: 'invoices_all', label: 'All Invoices', href: '/admin/invoices', icon: FileText },
          { id: 'invoices_sequences', label: 'Sequences', href: '/admin/invoices/sequences', icon: FileText },
          // NOTE: Removed stale "Templates" link as there is no /admin/invoices/templates page
        ],
      },
      { id: 'payments', label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { id: 'expenses', label: 'Expenses', href: '/admin/expenses', icon: Receipt },
      { id: 'taxes', label: 'Taxes', href: '/admin/taxes', icon: DollarSign },
    ],
  },
  {
    key: 'operations',
    items: [
      { id: 'tasks', label: 'Tasks', href: '/admin/tasks', icon: CheckSquare, permission: PERMISSIONS.TASKS_READ_ALL, badgeKey: 'overdueTasks' },
      { id: 'team', label: 'Team', href: '/admin/team', icon: UserCog, permission: PERMISSIONS.TEAM_VIEW },
      { id: 'chat', label: 'Chat', href: '/admin/chat', icon: Mail },
      { id: 'reminders', label: 'Reminders', href: '/admin/reminders', icon: Bell },
    ],
  },
  {
    key: 'system',
    items: [
      { id: 'settings', label: 'Settings', href: '/admin/settings', icon: SettingsIcon, children: [] },
      { id: 'cron_telemetry', label: 'Cron Telemetry', href: '/admin/cron-telemetry', icon: Zap },
    ],
  },
]

export function getNavigation(params: { userRole?: string | null; counts?: Record<string, number | string | undefined> | null }) {
  const { userRole, counts } = params

  const allow = (perm?: string) => {
    if (!perm) return true
    return hasPermission(userRole, perm as any)
  }

  const mapItem = (item: NavItemMeta): NavItemMeta => {
    const badge = item.badgeKey ? (counts?.[item.badgeKey] as any) : undefined
    const children = item.children?.filter(chi => allow(chi.permission)).map(mapItem)
    return {
      ...item,
      // attach runtime-resolved badge as string|number if present
      ...(badge ? { badgeKey: item.badgeKey } : {}),
      ...(children ? { children } : {}),
    }
  }

  return NAVIGATION_SECTIONS.map(section => ({
    key: section.key,
    items: section.items.filter(i => allow(i.permission)).map(mapItem),
  }))
}
