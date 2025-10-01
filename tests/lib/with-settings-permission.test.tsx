import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import withSettingsPermission from '@/lib/settings/permissions'
import { PERMISSIONS } from '@/lib/permissions'

describe('withSettingsPermission helper', () => {
  it('wraps children and renders when permission allowed', () => {
    const Protected = withSettingsPermission(PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW)
    render(<Protected><div>Secret</div></Protected>)
    expect(screen.getByText('Secret')).toBeTruthy()
  })
})
