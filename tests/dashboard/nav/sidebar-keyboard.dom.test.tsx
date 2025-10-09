import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/services' }))

vi.mock('@/components/admin/providers/AdminContext', async () => {
  const actual: any = await vi.importActual('@/components/admin/providers/AdminContext')
  let collapsed = false
  const setSidebarCollapsed = vi.fn((v: boolean) => { collapsed = v })
  return {
    ...actual,
    useAdminContext: () => ({ sidebarCollapsed: collapsed, setSidebarCollapsed, currentTenant: null, userPermissions: [], isLoading: false })
  }
})

import Sidebar from '@/components/dashboard/Sidebar'

describe('Sidebar a11y and keyboard support', () => {
  it('exposes navigation landmark and supports toggle via accessible button', async () => {
    const { container } = render(<Sidebar />)

    const nav = container.querySelector('nav[role="navigation"][aria-label="Admin navigation"]')
    expect(nav).toBeTruthy()

    const active = Array.from(container.querySelectorAll('a')).find(a => a.getAttribute('href') === '/admin/services') as HTMLAnchorElement
    expect(active.getAttribute('aria-current')).toBe('page')

    const btn = container.querySelector('button[aria-label="Toggle sidebar"]') as HTMLButtonElement
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(btn)

    const ctxMod: any = await import('@/components/admin/providers/AdminContext')
    expect(ctxMod.useAdminContext().sidebarCollapsed).toBe(true)
  })
})
