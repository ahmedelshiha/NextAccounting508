import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsShell, { SettingsSection, SettingsCard } from '@/components/admin/settings/SettingsShell'

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/booking' }))

describe('SettingsShell (SSR-safe)', () => {
  it('renders header, description and children', () => {
    render(
      <SettingsShell title="My Title" description="A short description">
        <div>Inner content</div>
      </SettingsShell>
    )

    expect(screen.getByText('My Title')).toBeTruthy()
    expect(screen.getByText('A short description')).toBeTruthy()
    expect(screen.getByText('Inner content')).toBeTruthy()
  })

  it('shows alerts for errors, warnings and info', () => {
    render(
      <SettingsShell
        title="X"
        errors={["Error 1","Error 2"]}
        warnings={["Warn"]}
        info="Helpful info"
      >
        <div>Content</div>
      </SettingsShell>
    )

    expect(screen.getByText('Error')).toBeTruthy()
    expect(screen.getByText('Warn')).toBeTruthy()
    expect(screen.getByText('Helpful info')).toBeTruthy()
  })

  it('renders tabs when provided and shows active child', () => {
    const tabs = [{ key: 'a', label: 'Tab A' }, { key: 'b', label: 'Tab B' }]
    render(
      <SettingsShell title="T" tabs={tabs} activeTab={'a'}>
        <div>Tab content</div>
      </SettingsShell>
    )

    expect(screen.getByText('Tab A')).toBeTruthy()
    expect(screen.getByText('Tab content')).toBeTruthy()
  })

  it('renders sidebar prop when provided', () => {
    render(
      <SettingsShell title="T" sidebar={<div>Sidebar item</div>}>
        <div>Main</div>
      </SettingsShell>
    )

    expect(screen.getByText('Sidebar item')).toBeTruthy()
    expect(screen.getByText('Main')).toBeTruthy()
  })

  it('SettingsSection and SettingsCard render children', () => {
    render(
      <div>
        <SettingsSection title="Sec" description="Desc"> 
          <p>Inside section</p>
        </SettingsSection>
        <SettingsCard>Card content</SettingsCard>
      </div>
    )

    expect(screen.getByText('Sec')).toBeTruthy()
    expect(screen.getByText('Inside section')).toBeTruthy()
    expect(screen.getByText('Card content')).toBeTruthy()
  })
})
