import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { BulkUserLanguageAssignPanel } from '../components/BulkUserLanguageAssignPanel'
import { LocalizationProvider } from '../LocalizationProvider'

vi.mock('sonner')

const mockLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', enabled: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', enabled: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', enabled: true },
]

const mockUsers = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-3', name: 'Bob Johnson', email: 'bob@example.com' },
]

describe('BulkUserLanguageAssignPanel', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    vi.clearAllMocks()
  })

  describe('User Loading', () => {
    it('should load users on mount', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers }),
      })

      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      })
    })

    it('should show loading state while fetching users', () => {
      ;(global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({ data: [] }) }), 100))
      )

      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })

    it('should show error message if user loading fails', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to load users' }),
      })

      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load users')
      })
    })
  })

  describe('User Selection', () => {
    beforeEach(() => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers }),
      })
    })

    it('should toggle individual user selection', async () => {
      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const checkbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(checkbox)

      expect(checkbox).toBeChecked()
    })

    it('should select all users when clicking Select All', async () => {
      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const selectAllButton = screen.getByText('Select All')
      fireEvent.click(selectAllButton)

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
    })

    it('should deselect all users when clicking Deselect All after selecting all', async () => {
      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Select All'))
      await waitFor(() => {
        expect(screen.getByText('Deselect All')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Deselect All'))

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked()
      })
    })
  })

  describe('Language Selection', () => {
    beforeEach(() => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers }),
      })
    })

    it('should allow selecting target language', async () => {
      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const languageSelect = screen.getByDisplayValue('-- Select Language --')
      fireEvent.change(languageSelect, { target: { value: 'es' } })

      expect(languageSelect).toHaveValue('es')
    })
  })

  describe('Bulk Assignment', () => {
    beforeEach(() => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { success: true, updated: 2, failed: 0, errors: [] },
          }),
        })
    })

    it('should disable Apply button when no users are selected', async () => {
      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const applyButton = screen.getByRole('button', { name: /Apply to 0 Users/i })
      expect(applyButton).toBeDisabled()
    })

    it('should disable Apply button when no language is selected', async () => {
      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const checkbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(checkbox)

      const applyButton = screen.getByRole('button', { name: /Apply to 1 User/i })
      expect(applyButton).toBeDisabled()
    })

    it('should show error toast if no users selected and Apply is clicked', async () => {
      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const languageSelect = screen.getByDisplayValue('-- Select Language --')
      fireEvent.change(languageSelect, { target: { value: 'es' } })

      const applyButton = screen.getByRole('button', { name: /Apply to 0 Users/i })
      fireEvent.click(applyButton)

      expect(toast.error).toHaveBeenCalledWith('Please select at least one user')
    })

    it('should submit bulk assignment request with selected users and language', async () => {
      ;(global.fetch as any).clearMocks()
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { success: true, updated: 2, failed: 0, errors: [] },
          }),
        })

      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[1])

      const languageSelect = screen.getByDisplayValue('-- Select Language --')
      fireEvent.change(languageSelect, { target: { value: 'es' } })

      const applyButton = screen.getByRole('button', { name: /Apply to 2 Users/i })
      fireEvent.click(applyButton)

      await waitFor(() => {
        const calls = (global.fetch as any).mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall[0]).toBe('/api/admin/users/bulk-language-assign')
        expect(lastCall[1].method).toBe('POST')

        const body = JSON.parse(lastCall[1].body)
        expect(body.userIds).toEqual(['user-1', 'user-2'])
        expect(body.targetLanguage).toBe('es')
      })
    })

    it('should show success results after successful assignment', async () => {
      ;(global.fetch as any).clearMocks()
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { success: true, updated: 2, failed: 0, errors: [] },
          }),
        })

      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[1])

      const languageSelect = screen.getByDisplayValue('-- Select Language --')
      fireEvent.change(languageSelect, { target: { value: 'es' } })

      const applyButton = screen.getByRole('button', { name: /Apply to 2 Users/i })
      fireEvent.click(applyButton)

      await waitFor(() => {
        expect(screen.getByText('✓ Bulk Assignment Complete')).toBeInTheDocument()
        expect(screen.getByText(/Updated: 2 user\(s\)/)).toBeInTheDocument()
        expect(toast.success).toHaveBeenCalledWith('Successfully updated 2 user(s)')
      })
    })

    it('should show partial results when some assignments fail', async () => {
      ;(global.fetch as any).clearMocks()
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              success: false,
              updated: 2,
              failed: 1,
              errors: ['User user-3 not in current tenant'],
            },
          }),
        })

      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[1])
      fireEvent.click(checkboxes[2])

      const languageSelect = screen.getByDisplayValue('-- Select Language --')
      fireEvent.change(languageSelect, { target: { value: 'es' } })

      const applyButton = screen.getByRole('button', { name: /Apply to 3 Users/i })
      fireEvent.click(applyButton)

      await waitFor(() => {
        expect(screen.getByText('⚠ Bulk Assignment Partial')).toBeInTheDocument()
        expect(screen.getByText(/Updated: 2 user\(s\)/)).toBeInTheDocument()
        expect(screen.getByText(/Failed: 1 user\(s\)/)).toBeInTheDocument()
      })
    })
  })

  describe('Results Dismissal', () => {
    beforeEach(() => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { success: true, updated: 1, failed: 0, errors: [] },
          }),
        })
    })

    it('should dismiss results when Dismiss button is clicked', async () => {
      ;(global.fetch as any).clearMocks()
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { success: true, updated: 1, failed: 0, errors: [] },
          }),
        })

      render(
        <LocalizationProvider languages={mockLanguages}>
          <BulkUserLanguageAssignPanel />
        </LocalizationProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const checkbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(checkbox)

      const languageSelect = screen.getByDisplayValue('-- Select Language --')
      fireEvent.change(languageSelect, { target: { value: 'es' } })

      const applyButton = screen.getByRole('button', { name: /Apply to 1 User/i })
      fireEvent.click(applyButton)

      await waitFor(() => {
        expect(screen.getByText('✓ Bulk Assignment Complete')).toBeInTheDocument()
      })

      const dismissButton = screen.getByText('Dismiss')
      fireEvent.click(dismissButton)

      expect(screen.queryByText('✓ Bulk Assignment Complete')).not.toBeInTheDocument()
    })
  })
})
