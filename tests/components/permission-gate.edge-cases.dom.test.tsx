import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: { user: {} } }))
}))

const mockUseSession = (role?: string | null) => {
  const mod = require('next-auth/react')
  mod.useSession.mockReturnValue({ data: { user: role ? { role } : {} } })
}

describe('PermissionGate edge cases', () => {
  beforeEach(() => {
    mockUseSession(undefined)
  })

  it('renders fallback when role is undefined', () => {
    render(
      <PermissionGate permission={PERMISSIONS.SERVICES_VIEW} fallback={<div data-testid="fb">nope</div>}>
        <div data-testid="ok">ok</div>
      </PermissionGate>
    )
    expect(screen.queryByTestId('ok')).toBeNull()
    expect(screen.getByTestId('fb')).toBeInTheDocument()
  })

  it('renders children when any permission in array matches', () => {
    mockUseSession('TEAM_MEMBER')
    render(
      <PermissionGate permission={[PERMISSIONS.SERVICES_VIEW, PERMISSIONS.USERS_MANAGE]} fallback={<div data-testid="fb">nope</div>}>
        <div data-testid="ok">ok</div>
      </PermissionGate>
    )
    expect(screen.getByTestId('ok')).toBeInTheDocument()
    expect(screen.queryByTestId('fb')).toBeNull()
  })

  it('renders fallback when none of the permissions match', () => {
    mockUseSession('CLIENT')
    render(
      <PermissionGate permission={[PERMISSIONS.USERS_MANAGE]} fallback={<div data-testid="fb">nope</div>}>
        <div data-testid="ok">ok</div>
      </PermissionGate>
    )
    expect(screen.queryByTestId('ok')).toBeNull()
    expect(screen.getByTestId('fb')).toBeInTheDocument()
  })
})
