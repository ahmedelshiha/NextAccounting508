import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SidebarNav from '@/components/admin/layout/Sidebar/SidebarNav'

const Icon = () => <span data-testid="icon" />

describe('SidebarNav', () => {
  it('renders sections and items and calls onToggleSection for groups', () => {
    const onToggle = vi.fn()
    const navigation = [
      {
        section: 'Main',
        items: [
          { name: 'Dashboard', href: '/admin', icon: Icon },
          {
            name: 'Settings',
            href: '/admin/settings',
            icon: Icon,
            children: [
              { name: 'General', href: '/admin/settings/general', icon: Icon, permission: 'org.settings.view' },
            ],
          },
        ],
      },
    ]

    render(
      <SidebarNav
        navigation={navigation}
        collapsed={false}
        expandedSections={[]}
        onToggleSection={onToggle}
        hasAccess={() => true}
        isActiveRoute={() => false}
      />,
    )

    // Section heading
    expect(screen.getByText('Main')).toBeTruthy()

    // Settings button present
    const btn = screen.getByText('Settings')
    expect(btn).toBeTruthy()

    fireEvent.click(btn)
    expect(onToggle).toHaveBeenCalled()
  })

  it('filters items when hasAccess returns false', () => {
    const onToggle = vi.fn()
    const navigation = [
      { section: 'Sec', items: [{ name: 'Hidden', href: '/x', icon: Icon, permission: 'secret' }] },
    ]

    render(
      <SidebarNav
        navigation={navigation}
        collapsed={false}
        expandedSections={[]}
        onToggleSection={onToggle}
        hasAccess={(p) => false}
        isActiveRoute={() => false}
      />,
    )

    expect(screen.queryByText('Hidden')).toBeNull()
  })
})
