import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test-mocks/testing-library-react'

// Simulate no session for this unit test to validate default context values
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: null, status: 'unauthenticated' }) }))

import { AdminContextProvider, useAdminContext } from '@/components/admin/providers/AdminContext'

function Probe() {
  const { currentTenant, userPermissions, isLoading, sidebarCollapsed } = useAdminContext()
  return (
    <div>
      tenant:{String(currentTenant)} perms:{userPermissions.length} loading:{isLoading ? '1' : '0'} collapsed:{sidebarCollapsed ? '1' : '0'}
    </div>
  )
}

describe('AdminContextProvider', () => {
  it('provides default values and renders children', () => {
    render(
      <AdminContextProvider>
        <Probe />
      </AdminContextProvider>
    )
    expect(screen.getByText('tenant:null perms:0 loading:0 collapsed:0')).toBeTruthy()
  })
})
