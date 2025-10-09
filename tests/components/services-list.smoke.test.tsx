// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@/test-mocks/testing-library-react'
import { describe, it, expect, vi } from 'vitest'
import ServicesList from '@/components/dashboard/lists/ServicesList'

vi.mock('next/link', () => ({ default: (props: any) => <a {...props} /> }))
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/services' }))
vi.mock('@/lib/api', () => ({
  apiFetch: async () => ({ ok: true, json: async () => ({ services: [{ id: '1', name: 'Tax Prep', category: 'Tax', price: 100, status: 'ACTIVE', updatedAt: '2025-01-01T00:00:00Z' }] }) })
}))

// Provide a naive t() via context-less default behavior

describe('ServicesList smoke', () => {
  it('renders title and row', async () => {
    render(<ServicesList />)

    // Title falls back to key when i18n not loaded
    await screen.findByText(/dashboard\.services\.title|Key Performance|Services/i)
    await screen.findByText('Tax Prep')
  })
})
