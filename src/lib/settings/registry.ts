// src/lib/settings/registry.ts
// Central registry of settings categories used by the admin sidebar and settings pages.

import { Building2, Cog, Users, ClipboardList, ShieldCheck, CreditCard, LineChart, MessageSquare, PlugZap, ServerCog } from 'lucide-react'
import type { SettingsCategory } from './types'

// Keep tabs empty here — individual category modules will register their own tabs or the registry can be extended at runtime.
export const SETTINGS_REGISTRY: SettingsCategory[] = [
  {
    key: 'organization',
    label: 'Organization Settings',
    route: '/admin/settings/company',
    icon: Building2,
    tabs: []
  },
  {
    key: 'serviceManagement',
    label: 'Service Management',
    route: '/admin/settings/services',
    icon: ClipboardList,
    tabs: []
  },
  {
    key: 'booking',
    label: 'Booking Configuration',
    route: '/admin/settings/booking',
    icon: Cog,
    tabs: []
  },
  {
    key: 'clientManagement',
    label: 'Client Management',
    route: '/admin/settings/clients',
    icon: Users,
    tabs: []
  },
  {
    key: 'taskWorkflow',
    label: 'Task & Workflow',
    route: '/admin/settings/tasks',
    icon: ClipboardList,
    tabs: []
  },
  {
    key: 'teamManagement',
    label: 'Team Management',
    route: '/admin/settings/team',
    icon: Users,
    tabs: []
  },
  {
    key: 'financial',
    label: 'Financial Settings',
    route: '/admin/settings/financial',
    icon: CreditCard,
    tabs: []
  },
  {
    key: 'analyticsReporting',
    label: 'Analytics & Reporting',
    route: '/admin/settings/analytics',
    icon: LineChart,
    tabs: []
  },
  {
    key: 'communication',
    label: 'Communication',
    route: '/admin/settings/communication',
    icon: MessageSquare,
    tabs: []
  },
  {
    key: 'securityCompliance',
    label: 'Security & Compliance',
    route: '/admin/settings/security',
    icon: ShieldCheck,
    tabs: []
  },
  {
    key: 'integrationHub',
    label: 'Integration Hub',
    route: '/admin/settings/integrations',
    icon: PlugZap,
    tabs: []
  },
  {
    key: 'systemAdministration',
    label: 'System Administration',
    route: '/admin/settings/system',
    icon: ServerCog,
    tabs: []
  }
]

export default SETTINGS_REGISTRY
