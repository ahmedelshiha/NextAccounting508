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
    icon: (props) => <Building2 {...props} />,
    tabs: []
  },
  {
    key: 'serviceManagement',
    label: 'Service Management',
    route: '/admin/settings/services',
    icon: (props) => <ClipboardList {...props} />,
    tabs: []
  },
  {
    key: 'booking',
    label: 'Booking Configuration',
    route: '/admin/settings/booking',
    icon: (props) => <Cog {...props} />,
    tabs: []
  },
  {
    key: 'clientManagement',
    label: 'Client Management',
    route: '/admin/settings/clients',
    icon: (props) => <Users {...props} />,
    tabs: []
  },
  {
    key: 'taskWorkflow',
    label: 'Task & Workflow',
    route: '/admin/settings/tasks',
    icon: (props) => <ClipboardList {...props} />,
    tabs: []
  },
  {
    key: 'teamManagement',
    label: 'Team Management',
    route: '/admin/settings/team',
    icon: (props) => <Users {...props} />,
    tabs: []
  },
  {
    key: 'financial',
    label: 'Financial Settings',
    route: '/admin/settings/financial',
    icon: (props) => <CreditCard {...props} />,
    tabs: []
  },
  {
    key: 'analyticsReporting',
    label: 'Analytics & Reporting',
    route: '/admin/settings/analytics',
    icon: (props) => <LineChart {...props} />,
    tabs: []
  },
  {
    key: 'communication',
    label: 'Communication',
    route: '/admin/settings/communication',
    icon: (props) => <MessageSquare {...props} />,
    tabs: []
  },
  {
    key: 'securityCompliance',
    label: 'Security & Compliance',
    route: '/admin/settings/security',
    icon: (props) => <ShieldCheck {...props} />,
    tabs: []
  },
  {
    key: 'integrationHub',
    label: 'Integration Hub',
    route: '/admin/settings/integrations',
    icon: (props) => <PlugZap {...props} />,
    tabs: []
  },
  {
    key: 'systemAdministration',
    label: 'System Administration',
    route: '/admin/settings/system',
    icon: (props) => <ServerCog {...props} />,
    tabs: []
  }
]

export default SETTINGS_REGISTRY