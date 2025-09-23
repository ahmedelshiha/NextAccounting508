import { Home, Users, UserCheck, Calendar, Briefcase, Clock, FileText, CreditCard, DollarSign, BarChart3, Shield, Settings, Bell, Zap } from 'lucide-react'
import type { NavGroup } from '@/types/dashboard'

export const navGroups: NavGroup[] = [
  { label: 'Dashboard', items: [
    { label: 'Overview', href: '/admin', icon: Home },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ]},
  { label: 'Clients', items: [
    { label: 'Client List', href: '/admin/users', icon: Users },
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
