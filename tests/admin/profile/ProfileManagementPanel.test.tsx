import { render, screen } from '../../test-mocks/testing-library-react'
import ProfileManagementPanel from '@/components/admin/profile/ProfileManagementPanel'

describe('ProfileManagementPanel', () => {
  it('renders dialog title and tabs', () => {
    render(<ProfileManagementPanel isOpen onClose={() => {}} defaultTab="profile" />)
    expect(screen.getByText('Manage profile').textContent).toContain('Manage profile')
    expect(screen.getByText('Profile').textContent).toContain('Profile')
    expect(screen.getByText('Sign in & security').textContent).toContain('Sign in & security')
  })

  it('renders profile field labels', () => {
    render(<ProfileManagementPanel isOpen onClose={() => {}} defaultTab="profile" />)
    expect(screen.getByText('Basic information').textContent).toContain('Basic information')
  })

  it('renders security section labels', () => {
    render(<ProfileManagementPanel isOpen onClose={() => {}} defaultTab="security" />)
    expect(screen.getByText('Sign in & security').textContent).toContain('Sign in & security')
    expect(screen.getByText('User ID').textContent).toContain('User ID')
    expect(screen.getByText('Password').textContent).toContain('Password')
    expect(screen.getByText('Two-factor authentication').textContent).toContain('Two-factor authentication')
    expect(screen.getByText('Email verification').textContent).toContain('Email verification')
  })
})
