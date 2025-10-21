import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserProfile } from '@/hooks/useUserProfile'

// Mock apiFetch
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

describe('useUserProfile Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with null profile', () => {
    const { result } = renderHook(() => useUserProfile())

    expect(result.current.profile).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches profile on mount', async () => {
    const mockProfile = { id: '1', name: 'John Doe', email: 'john@example.com' }
    ;(apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockProfile }),
    })

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.loading).toBe(false)
    })

    expect(apiFetch).toHaveBeenCalledWith('/api/users/me')
  })

  it('handles fetch error gracefully', async () => {
    ;(apiFetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.loading).toBe(false)
    })
  })

  it('updates profile successfully', async () => {
    const mockProfile = { id: '1', name: 'John Doe' }
    const updatedProfile = { id: '1', name: 'Jane Doe' }

    ;(apiFetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: updatedProfile }),
      })

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => expect(result.current.profile).toEqual(mockProfile))

    await act(async () => {
      await result.current.update({ name: 'Jane Doe' })
    })

    expect(result.current.profile).toEqual(updatedProfile)
    expect(toast.success).toHaveBeenCalledWith('Profile updated')
  })

  it('handles update error', async () => {
    const mockProfile = { id: '1', name: 'John' }
    ;(apiFetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockProfile }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => expect(result.current.profile).toEqual(mockProfile))

    await expect(
      act(async () => {
        await result.current.update({ name: 'Jane' })
      })
    ).rejects.toThrow()
  })

  it('can manually refresh profile', async () => {
    const mockProfile = { id: '1', name: 'John' }
    ;(apiFetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { ...mockProfile, name: 'Jane' } }),
      })

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => expect(result.current.profile?.name).toBe('John'))

    await act(async () => {
      await result.current.refresh()
    })

    await waitFor(() => expect(result.current.profile?.name).toBe('Jane'))
  })

  it('shows loading state during operations', async () => {
    ;(apiFetch as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({ user: {} }) }), 100))
    )

    const { result } = renderHook(() => useUserProfile())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
