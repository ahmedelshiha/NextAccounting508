import { describe, it, expect, vi } from 'vitest'
import { renderDOM } from '../../../test-mocks/dom'

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
  it('exposes navigation landmark and supports toggle via accessible button', () => {
    const { container, getByText, unmount } = renderDOM(<Sidebar />)
    try {
      const nav = container.querySelector('nav[role="navigation"][aria-label="Admin navigation"]')
      expect(nav).toBeTruthy()
      // active link has aria-current
      const active = Array.from(container.querySelectorAll('a')).find(a => a.getAttribute('href') === '/admin/services') as HTMLAnchorElement
      expect(active.getAttribute('aria-current')).toBe('page')
      // toggle button present
      const btn = container.querySelector('button[aria-label="Toggle sidebar"]') as HTMLButtonElement
      expect(btn).toBeTruthy()
      btn.click()
      // triggered setter in mocked context
      const ctxMod: any = require('@/components/admin/providers/AdminContext')
      expect(ctxMod.useAdminContext().sidebarCollapsed).toBe(true)
    } finally {
      unmount()
    }
  })
})
