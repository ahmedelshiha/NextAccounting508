import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPermissionWrapper from '@/components/admin/settings/SettingsPermissionWrapper'
import { PERMISSIONS } from '@/lib/permissions'

describe('SettingsPermissionWrapper', () => {
  it('renders children when session has ADMIN role (text-only)', () => {
    render(
      <SettingsPermissionWrapper permission={[PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW]}>
        <div>Protected Content</div>
      </SettingsPermissionWrapper>
    )

    expect(screen.getByText('Protected Content')).toBeTruthy()
  })
})
