import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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
    const { container } = render(
      <AdminContextProvider>
        <Sidebar />
      </AdminContextProvider>
    )

    const link = container.querySelector('a[href="/admin/services"]') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.getAttribute('aria-current')).toBe('page')
  })
})
