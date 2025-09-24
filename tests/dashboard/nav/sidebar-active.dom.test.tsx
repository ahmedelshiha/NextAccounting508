import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import Sidebar from '@/components/dashboard/Sidebar'
import { AdminContextProvider } from '@/components/admin/providers/AdminContext'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'ADMIN', permissions: [] } }, status: 'authenticated' })
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/services'
}))

describe('Sidebar active state & navigation IA', () => {
  it('marks current route with aria-current and correct classes', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    root.render(
      <AdminContextProvider>
        <Sidebar />
      </AdminContextProvider>
    )

    const link = container.querySelector('a[href="/admin/services"]') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.getAttribute('aria-current')).toBe('page')
  })
})
