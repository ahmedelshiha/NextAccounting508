import React from 'react'
import { render, fireEvent, waitFor } from '../../../test-mocks/testing-library-react'
import { describe, it, vi, beforeEach, expect } from 'vitest'

// Mock the useUserPreferences hook
vi.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({
    preferences: { timezone: 'UTC', preferredLanguage: 'en' },
    loading: false,
    error: null,
    updatePreferences: vi.fn(async () => ({ timezone: 'UTC', preferredLanguage: 'en' })),
    refetch: vi.fn(),
    mutate: vi.fn(),
  }),
}))

import LocalizationTab from '@/components/admin/profile/LocalizationTab'

describe('LocalizationTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls updatePreferences with current values on save', async () => {
    // Import mocked hook to access the mock
    const hook = await import('@/hooks/useUserPreferences')
    const mockUpdate = (hook.useUserPreferences() as any).updatePreferences

    const { getByText } = render(<LocalizationTab loading={false} />)

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockUpdate.mock.calls[0][0]).toEqual({ timezone: 'UTC', preferredLanguage: 'en' })
    })
  })
})
