import { describe, it, expect, vi } from 'vitest'
import { ServicesSection } from '@/components/home/services-section'
import { render, screen } from '@/test-mocks/testing-library-react'

// Prevent effect from immediately finishing by mocking apiFetch to a pending promise
vi.mock('@/lib/api', () => ({ apiFetch: async () => new Promise(() => {}) }))

describe('ServicesSection loading a11y', () => {
  it('renders a polite live region and marks section busy while loading', () => {
    const { container, unmount } = render(<ServicesSection />)
    try {
      const section = container.querySelector('section[aria-busy="true"]')
      expect(section).toBeTruthy()
      const status = screen.getByRole('status')
      expect(status).toBeTruthy()
    } finally {
      unmount()
    }
  })
})
