import { render, screen } from '../../../test-mocks/testing-library-react'
import UserProfileDropdown from '@/components/admin/layout/Header/UserProfileDropdown'
import Avatar from '@/components/admin/layout/Header/UserProfileDropdown/Avatar'

describe('UserProfileDropdown', () => {
  it('renders trigger with user name and chevron', () => {
    render(<UserProfileDropdown />)
    expect(screen.getByRole('button', { name: /open user menu/i }).textContent).toBeDefined()
    expect(screen.getByText('Test User').textContent).toContain('Test User')
  })
})

describe('Avatar', () => {
  it('shows initials when no image is provided', () => {
    render(<Avatar name="Jane Doe" size="md" />)
    expect(screen.getByText('JD').textContent).toContain('JD')
  })
})
