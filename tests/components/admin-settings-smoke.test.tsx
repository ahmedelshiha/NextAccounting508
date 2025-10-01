import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { role: 'ADMIN' } } }) }))
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings' }))

import AdminSettingsPage from '@/app/admin/settings/page'
import SystemAdministrationPage from '@/app/admin/settings/system/page'

describe('Admin settings smoke checks', () => {
  it('settings landing shows welcome and no platform widgets', () => {
    render(<AdminSettingsPage />)
    expect(screen.getByText('Welcome to Settings')).toBeTruthy()

    // Ensure platform widgets are not present on landing
    const containsDatabase = (() => { try { screen.getByText('Database'); return true } catch { return false } })()
    const containsAuth = (() => { try { screen.getByText('Authentication'); return true } catch { return false } })()
    const containsEnv = (() => { try { screen.getByText('Environment'); return true } catch { return false } })()

    expect(containsDatabase).toBe(false)
    expect(containsAuth).toBe(false)
    expect(containsEnv).toBe(false)
  })

  it('system page contains platform health widgets', () => {
    render(<SystemAdministrationPage />)
    // The cards should be present in the system page
    expect(screen.getByText('Database')).toBeTruthy()
    expect(screen.getByText('Authentication')).toBeTruthy()
    expect(screen.getByText('Environment')).toBeTruthy()
  })
})
