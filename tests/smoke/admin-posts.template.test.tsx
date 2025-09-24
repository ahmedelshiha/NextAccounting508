import { render, screen } from '@/test-mocks/testing-library-react'
import React from 'react'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(async () => ({ ok: true, json: async () => ({ posts: [] }) }))
}))

import AdminPostsPage from '@/app/admin/posts/page'

describe('Admin Posts Page (StandardPage)', () => {
  it('renders title and empty state', async () => {
    render(<AdminPostsPage />)
    expect(await screen.findByText('Posts')).toBeTruthy()
    expect(await screen.findByText(/No posts match your criteria/)).toBeTruthy()
  })
})
