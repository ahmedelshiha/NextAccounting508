import { renderToStaticMarkup } from 'react-dom/server'

// Mock the heavy AvailabilitySlotsManager rendering with a lightweight placeholder
vi.mock('@/components/admin/AvailabilitySlotsManager', () => ({ default: () => 'availability-slots-manager' }))

import AdminAvailabilityPage from '@/app/admin/availability/page'

describe('Admin Availability a11y', () => {
  it('renders labeled page content within the standard workspace', async () => {
    const html = renderToStaticMarkup(AdminAvailabilityPage())
    // Title text should be present
    expect(/Availability/.test(html)).toBe(true)
    // Ensure the manager placeholder is rendered
    expect(/availability-slots-manager/.test(html)).toBe(true)
  })
})
