import { render, screen } from '../../../test-mocks/testing-library-react'
import { AdminProviders } from '@/components/admin/providers/AdminProviders'

describe('AdminProviders', () => {
  it('composes providers and renders children in SSR', () => {
    render(
      <AdminProviders session={{ user: { id: 'u1', permissions: [] } }}>
        <div>Child content</div>
      </AdminProviders>
    )
    expect(screen.getByText('Child content')).toBeTruthy()
  })
})
