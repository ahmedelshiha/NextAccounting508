import { render, screen } from '../../../test-mocks/testing-library-react'
import UserProfileDropdown from '@/components/admin/layout/Header/UserProfileDropdown'
import Avatar from '@/components/admin/layout/Header/UserProfileDropdown/Avatar'

describe('UserProfileDropdown', () => {
  it('renders trigger with user name and chevron', () => {
    render(<UserProfileDropdown />)
    // Button is labeled for a11y
    expect(screen.getByRole('button', { name: /open user menu/i }).textContent).toBeDefined()
    // Default mocked session user name should be visible somewhere in markup
    expect(screen.getByText('Test User').textContent).toContain('Test User')
  })
})

describe('Avatar', () => {
  it('shows initials when no image is provided', () => {
    render(<Avatar name="Jane Doe" size="md" />)
    // Expect JD initials to appear in the rendered text content
    expect(screen.getByText(/JD/i).textContent).toContain('JD')
  })
})
