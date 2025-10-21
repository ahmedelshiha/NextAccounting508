import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import PreferencesTab from '@/components/admin/profile/PreferencesTab'

vi.mock('@/lib/api', () => ({
  __esModule: true,
  apiFetch: vi.fn(async (_url: string, opts?: RequestInit) => ({ ok: true, json: async () => ({ ok: true, ...(opts && opts.body ? JSON.parse(opts.body as string) : {}) }) }))
}))

describe('PreferencesTab', () => {
  beforeEach(async () => {
    // mock initial fetch load
    const mod = await import('@/lib/api')
    ;(mod.apiFetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ timezone: 'UTC', preferredLanguage: 'en', reminderHours: [24,2] }) })
  })

  it('saves preferences successfully', async () => {
    render(<PreferencesTab loading={false} />)
    const btn = await screen.findByRole('button', { name: /save preferences/i })
    fireEvent.click(btn)
    const mod = await import('@/lib/api')
    expect((mod as any).apiFetch).toHaveBeenCalledWith('/api/user/preferences', expect.objectContaining({ method: 'PUT' }))
  })
})
