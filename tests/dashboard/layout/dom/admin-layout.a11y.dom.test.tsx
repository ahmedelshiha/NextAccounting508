import { describe, it, expect, vi } from 'vitest'
import { renderDOM, fire } from '../../../../test-mocks/dom'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

vi.mock('@/components/admin/providers/AdminContext', async () => {
  const actual: any = await vi.importActual('@/components/admin/providers/AdminContext')
  return {
    ...actual,
    useAdminContext: () => ({ sidebarCollapsed: false, setSidebarCollapsed: () => {}, currentTenant: null, userPermissions: [], isLoading: false })
  }
})

// Avoid EventSource usage if any nested provider is accidentally pulled in
vi.mock('@/components/dashboard/realtime/RealtimeProvider', () => ({ RealtimeProvider: ({ children }: any) => children }))

function Page() {
  return (
    <DashboardLayout>
      <h1>Test Admin Page</h1>
      <p>Some content for accessibility testing.</p>
    </DashboardLayout>
  )
}

describe('Admin layout a11y landmarks', () => {
  it('exposes skip link, navigation landmark, and main landmark with focus target', () => {
    const { container, unmount } = renderDOM(<Page />)
    try {
      const skip = container.querySelector('a[href="#admin-main-content"]') as HTMLAnchorElement
      expect(skip).toBeTruthy()

      const aside = container.querySelector('aside[role="navigation"][aria-label="Admin sidebar"]') as HTMLElement
      expect(aside).toBeTruthy()

      const main = container.querySelector('main#admin-main-content') as HTMLElement
      expect(main).toBeTruthy()
      expect(main.getAttribute('tabindex')).toBe('-1')

      // Activate skip link to move focus to main content
      fire.click(skip)
      expect(document.activeElement).toBe(main)
    } finally {
      unmount()
    }
  })
})
