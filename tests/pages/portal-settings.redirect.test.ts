import { describe, it, expect, vi } from 'vitest'

vi.doMock('next/navigation', () => ({
  __esModule: true,
  redirect: vi.fn(),
}))

import Page, { metadata } from '@/app/portal/settings/page'

describe('/portal/settings redirect', () => {
  it('has metadata', () => {
    expect(metadata.title).toBeTruthy()
  })

  it('redirects to /admin/profile?tab=preferences for authenticated users', async () => {
    const { redirect } = await import('next/navigation') as any
    await Page()
    expect(redirect).toHaveBeenCalledWith('/admin/profile?tab=preferences')
  })
})
