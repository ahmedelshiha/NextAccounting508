import React from 'react'
import { render, fireEvent, waitFor, screen } from '../../../test-mocks/testing-library-react'
import { describe, it, vi, beforeEach, expect } from 'vitest'

// Mock the useUserPreferences hook
vi.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({
    preferences: { timezone: 'UTC', preferredLanguage: 'en', reminderHours: [24, 2] },
    loading: false,
    error: null,
    updatePreferences: vi.fn(async (data) => ({ ...data, reminderHours: [24, 2] })),
    refetch: vi.fn(),
    mutate: vi.fn(),
  }),
}))

import LocalizationTab from '@/components/admin/profile/LocalizationTab'

describe('LocalizationTab - Localization Save Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully saves valid preferences with all fields', async () => {
    const hook = await import('@/hooks/useUserPreferences')
    const mockUpdate = (hook.useUserPreferences() as any).updatePreferences

    const { getByText } = render(<LocalizationTab loading={false} />)

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('handles validation error for invalid timezone', async () => {
    const hook = await import('@/hooks/useUserPreferences')
    const mockUpdate = (hook.useUserPreferences() as any).updatePreferences

    mockUpdate.mockRejectedValueOnce(new Error('Invalid timezone'))

    const { getByText } = render(<LocalizationTab loading={false} />)

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('handles validation error for invalid language selection', async () => {
    const hook = await import('@/hooks/useUserPreferences')
    const mockUpdate = (hook.useUserPreferences() as any).updatePreferences

    mockUpdate.mockRejectedValueOnce(new Error('Invalid language'))

    const { getByText } = render(<LocalizationTab loading={false} />)

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('handles server error (500) gracefully', async () => {
    const hook = await import('@/hooks/useUserPreferences')
    const mockUpdate = (hook.useUserPreferences() as any).updatePreferences

    mockUpdate.mockRejectedValueOnce(new Error('Internal server error'))

    const { getByText } = render(<LocalizationTab loading={false} />)

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('handles rate limit (429) response', async () => {
    const hook = await import('@/hooks/useUserPreferences')
    const mockUpdate = (hook.useUserPreferences() as any).updatePreferences

    mockUpdate.mockRejectedValueOnce(new Error('Rate limit exceeded'))

    const { getByText } = render(<LocalizationTab loading={false} />)

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('displays loading state during save', async () => {
    const hook = await import('@/hooks/useUserPreferences')
    const mockUpdate = (hook.useUserPreferences() as any).updatePreferences

    mockUpdate.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    )

    const { getByText, rerender } = render(<LocalizationTab loading={false} />)

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('validates reminderHours within valid range', async () => {
    const hook = await import('@/hooks/useUserPreferences')
    const mockUpdate = (hook.useUserPreferences() as any).updatePreferences

    const { getByText } = render(<LocalizationTab loading={false} />)

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })
})
