import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { role: 'ADMIN' } }, status: 'authenticated' }) }))
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/users' }))
vi.mock('@/app/admin/users/page', () => ({ default: () => <div data-testid="users-tab">users-list</div> }))
vi.mock('@/app/admin/roles/page', () => ({ default: () => <div data-testid="roles-tab">roles-list</div> }))
vi.mock('@/app/admin/permissions/page', () => ({ default: () => <div data-testid="permissions-tab">permissions-list</div> }))

import SettingsUsersPage from '@/app/admin/settings/users/page'

describe('SettingsUsersPage', () => {
  it('renders tabs and switches content', () => {
    render(<SettingsUsersPage />)
    // default active is users
    expect(screen.getByTestId('users-tab')).toBeInTheDocument()
    // switch to roles
    fireEvent.click(screen.getByText('Roles'))
    expect(screen.getByTestId('roles-tab')).toBeInTheDocument()
    // switch to permissions
    fireEvent.click(screen.getByText('Permissions'))
    expect(screen.getByTestId('permissions-tab')).toBeInTheDocument()
  })
})
