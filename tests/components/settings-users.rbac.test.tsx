import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { role: 'USER' } }, status: 'authenticated' }) }))
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/users' }))

// default mocks for pages
vi.mock('@/app/admin/users/page', () => ({ default: () => <div data-testid="users-tab">users-list</div> }))
vi.mock('@/app/admin/roles/page', () => ({ default: () => <div data-testid="roles-tab">roles-list</div> }))
vi.mock('@/app/admin/permissions/page', () => ({ default: () => <div data-testid="permissions-tab">permissions-list</div> }))

// permissions module will be mocked per test
import SettingsUsersPage from '@/app/admin/settings/users/page'

describe('SettingsUsersPage RBAC', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('hides roles and permissions content when user lacks USERS_MANAGE', async () => {
    // mock permissions to deny USERS_MANAGE
    vi.doMock('@/lib/permissions', () => ({ hasPermission: () => false, PERMISSIONS: { USERS_VIEW: 'USERS_VIEW', USERS_MANAGE: 'USERS_MANAGE' } }))
    const { default: Page } = await import('@/app/admin/settings/users/page')
    render(<Page />)

    // users tab (default)
    expect(screen.getByTestId('users-tab')).toBeInTheDocument()

    // switch to Roles
    fireEvent.click(screen.getByText('Roles'))
    // roles page is wrapped with PermissionGate in its implementation; fallback should be shown
    expect(await screen.findByText(/You do not have access to Roles|You do not have access/)).toBeInTheDocument()

    // switch to Permissions
    fireEvent.click(screen.getByText('Permissions'))
    expect(await screen.findByText(/You do not have access to Permissions|You do not have access/)).toBeInTheDocument()
  })

  it('shows roles and permissions content when user has USERS_MANAGE', async () => {
    // mock permissions to allow USERS_MANAGE
    vi.doMock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: { USERS_VIEW: 'USERS_VIEW', USERS_MANAGE: 'USERS_MANAGE' } }))
    const { default: Page } = await import('@/app/admin/settings/users/page')
    render(<Page />)

    // default users tab
    expect(screen.getByTestId('users-tab')).toBeInTheDocument()

    // switch to Roles - should render roles content
    fireEvent.click(screen.getByText('Roles'))
    expect(await screen.findByTestId('roles-tab')).toBeInTheDocument()

    // switch to Permissions
    fireEvent.click(screen.getByText('Permissions'))
    expect(await screen.findByTestId('permissions-tab')).toBeInTheDocument()
  })
})
