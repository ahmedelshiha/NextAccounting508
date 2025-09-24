import { describe, it, expect, vi } from 'vitest'
import { renderDOM } from '../../test-mocks/dom'
import { ServicesSection } from '@/components/home/services-section'

// Prevent effect from immediately finishing by mocking apiFetch to a pending promise
vi.mock('@/lib/api', () => ({ apiFetch: async () => new Promise(() => {}) }))

describe('ServicesSection loading a11y', () => {
  it('renders a polite live region and marks section busy while loading', () => {
    const { container, unmount } = renderDOM(<ServicesSection />)
    try {
      const section = container.querySelector('section[aria-busy="true"]')
      expect(section).toBeTruthy()
      const status = container.querySelector('[role="status"][aria-live="polite"]')
      expect(status).toBeTruthy()
    } finally {
      unmount()
    }
  })
})
