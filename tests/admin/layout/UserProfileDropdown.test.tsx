import { render, screen } from '../../../test-mocks/testing-library-react'
import UserProfileDropdown from '@/components/admin/layout/Header/UserProfileDropdown'
import Avatar from '@/components/admin/layout/Header/UserProfileDropdown/Avatar'

describe('UserProfileDropdown', () => {
  it('renders trigger with user name and chevron', () => {
    render(<UserProfileDropdown />)
    expect(screen.getByRole('button', { name: /open user menu/i }).textContent).toBeDefined()
    expect(screen.getByText('Test User').textContent).toContain('Test User')
  })

  it('renders theme options (Light/Dark/System) in menu markup', () => {
    render(<UserProfileDropdown />)
    expect(screen.getByText('Light').textContent).toContain('Light')
    expect(screen.getByText('Dark').textContent).toContain('Dark')
    expect(screen.getByText('System').textContent).toContain('System')
  })

  it('renders status options when showStatus is true', () => {
    render(<UserProfileDropdown showStatus />)
    expect(screen.getByText('Online').textContent).toContain('Online')
    expect(screen.getByText('Away').textContent).toContain('Away')
    expect(screen.getByText('Busy').textContent).toContain('Busy')
  })

  it('shows Manage Profile when handler is provided', () => {
    render(<UserProfileDropdown onOpenProfilePanel={() => {}} />)
    expect(screen.getByText('Manage Profile').textContent).toContain('Manage Profile')
  })
})

describe('Avatar', () => {
  it('shows initials when no image is provided', () => {
    render(<Avatar name="Jane Doe" size="md" />)
    expect(screen.getByText(/JD/i).textContent).toContain('JD')
  })
})
