import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, beforeEach, expect } from 'vitest'

// Mock SETTINGS_REGISTRY and use-permissions
vi.mock('@/lib/settings/registry', async () => ({
  default: [
    { key: 'overview', label: 'Settings Overview', route: '/admin/settings', tabs: [] },
    { key: 'org', label: 'Organization', route: '/admin/settings/company', permission: 'org.view', tabs: [] },
    { key: 'svc', label: 'Services', route: '/admin/settings/services', tabs: [{ key: 'general', label: 'General', permission: 'svc.view' }] },
    { key: 'hiddenTabs', label: 'Hidden Tabs', route: '/admin/settings/hidden', tabs: [{ key: 'secret', label: 'Secret', permission: 'secret.view' }] },
  ],
}))

vi.mock('@/lib/use-permissions', async () => ({
  usePermissions: () => ({
    has: (p: string) => p === 'org.view' || p === 'svc.view',
  }),
}))

// Import after mocks
import SettingsNavigation from '@/components/admin/settings/SettingsNavigation'

describe('SettingsNavigation RBAC', () => {
  beforeEach(() => {
    // Ensure pathname hook returns root by mocking next/navigation usePathname
    vi.mock('next/navigation', async () => ({ usePathname: () => '/admin/settings' }))
  })

  it('shows items permitted by role and hides restricted categories with no visible tabs', () => {
    render(<SettingsNavigation />)
    // Overview always visible
    expect(screen.getByText('Settings Overview')).toBeInTheDocument()
    // Organization has org.view allowed
    expect(screen.getByText('Organization')).toBeInTheDocument()
    // Services has a tab with svc.view allowed -> visible
    expect(screen.getByText('Services')).toBeInTheDocument()
    // Hidden Tabs has only secret.view which is not allowed -> should not be present
    expect(screen.queryByText('Hidden Tabs')).toBeNull()
  })
})
