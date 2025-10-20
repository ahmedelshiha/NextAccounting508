import { render } from '../../../test-mocks/testing-library-react'
import ProfileManagementPanel from '@/components/admin/profile/ProfileManagementPanel'

describe('ProfileManagementPanel', () => {
  it('renders without crashing (profile tab)', () => {
    const { container } = render(<ProfileManagementPanel isOpen onClose={() => {}} defaultTab="profile" />)
    expect(typeof container).toBe('string')
    expect(container.length).toBeGreaterThan(0)
  })

  it('renders without crashing (security tab)', () => {
    const { container } = render(<ProfileManagementPanel isOpen onClose={() => {}} defaultTab="security" />)
    expect(typeof container).toBe('string')
    expect(container.length).toBeGreaterThan(0)
  })
})
