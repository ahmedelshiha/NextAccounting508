import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsSearch from '@/components/admin/settings/SettingsSearch'
import { useRouter } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock the search hook
vi.mock('@/hooks/admin/useSettingsSearchIndex', () => ({
  useSettingsSearchIndex: () => ({
    items: [
      {
        key: 'organization',
        label: 'Organization Settings',
        route: '/admin/settings/organization',
        category: 'organization',
      },
      {
        key: 'booking',
        label: 'Booking Settings',
        route: '/admin/settings/booking',
        category: 'booking',
      },
      {
        key: 'financial',
        label: 'Financial Settings',
        route: '/admin/settings/financial',
        category: 'financial',
      },
    ],
    fuse: {
      search: (query: string) => {
        const mockItems = [
          {
            key: 'organization',
            label: 'Organization Settings',
            route: '/admin/settings/organization',
            category: 'organization',
          },
          {
            key: 'booking',
            label: 'Booking Settings',
            route: '/admin/settings/booking',
            category: 'booking',
          },
          {
            key: 'financial',
            label: 'Financial Settings',
            route: '/admin/settings/financial',
            category: 'financial',
          },
        ]
        return mockItems
          .filter((item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.key.toLowerCase().includes(query.toLowerCase())
          )
          .map((item) => ({ item, score: 0.5 }))
      },
    },
  }),
}))

describe('SettingsSearch - Keyboard Interactions', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input', () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')
    expect(input).toBeInTheDocument()
  })

  it('should show keyboard shortcut hint (Cmd/Ctrl+K)', () => {
    render(<SettingsSearch />)
    const shortcutHint = screen.getByText('K')
    expect(shortcutHint).toBeInTheDocument()
  })

  it('should open search dropdown when input is focused', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
  })

  it('should filter results as user types', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…') as HTMLInputElement

    fireEvent.focus(input)
    await userEvent.type(input, 'booking')

    await waitFor(() => {
      expect(screen.getByText('Booking Settings')).toBeInTheDocument()
    })
  })

  it('should close dropdown on Escape key', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  it('should navigate down results with ArrowDown key', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    const firstItem = screen.getByRole('option', { hidden: true })
    expect(firstItem).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      const options = screen.getAllByRole('option', { hidden: true })
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('should navigate up results with ArrowUp key', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    // Go down
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      const options = screen.getAllByRole('option', { hidden: true })
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
    })

    // Go back up
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    await waitFor(() => {
      const options = screen.getAllByRole('option', { hidden: true })
      expect(options[0]).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('should not go above first item with ArrowUp', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    await waitFor(() => {
      const firstItem = screen.getByRole('option', { hidden: true })
      expect(firstItem).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('should not go below last item with ArrowDown', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings���')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    // Navigate to end
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    await waitFor(() => {
      const options = screen.getAllByRole('option', { hidden: true })
      const lastIndex = options.length - 1
      expect(options[lastIndex]).toHaveAttribute('aria-selected', 'true')
    })

    // Try to go down from last
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      const options = screen.getAllByRole('option', { hidden: true })
      const lastIndex = options.length - 1
      expect(options[lastIndex]).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('should navigate to selected item with Enter key', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/settings/organization')
    })
  })

  it('should navigate to selected item after ArrowDown + Enter', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      const options = screen.getAllByRole('option', { hidden: true })
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
    })

    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/settings/booking')
    })
  })

  it('should open search with Cmd+K (Mac)', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    await waitFor(() => {
      expect(document.activeElement).toBe(input)
    })
  })

  it('should open search with Ctrl+K (Windows/Linux)', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    await waitFor(() => {
      expect(document.activeElement).toBe(input)
    })
  })

  it('should reset active index when query changes', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…') as HTMLInputElement

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    // Navigate down
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      const options = screen.getAllByRole('option', { hidden: true })
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
    })

    // Type to filter (should reset index to 0)
    await userEvent.type(input, 'booking')
    await waitFor(() => {
      const firstItem = screen.getByRole('option', { hidden: true })
      expect(firstItem).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('should close dropdown on blur', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    fireEvent.blur(input)
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    }, { timeout: 300 })
  })

  it('should navigate via mouse click on result', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    const secondResult = screen.getByText('Booking Settings')
    fireEvent.mouseDown(secondResult)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/settings/booking')
    })
  })

  it('should handle rapid key presses', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    // Rapid navigation
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    await waitFor(() => {
      const options = screen.getAllByRole('option', { hidden: true })
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('should have proper ARIA attributes', async () => {
    render(<SettingsSearch />)
    const input = screen.getByPlaceholderText('Search settings…')

    expect(input).toHaveAttribute('aria-label', 'Search settings')

    fireEvent.focus(input)
    await waitFor(() => {
      const listbox = screen.getByRole('listbox')
      expect(listbox).toHaveAttribute('role', 'listbox')
      const options = screen.getAllByRole('option', { hidden: true })
      options.forEach((option) => {
        expect(option).toHaveAttribute('aria-selected')
      })
    })
  })
})
